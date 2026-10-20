"""FastAPI application exposing the probabilistic risk-assessment platform."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

from . import database as db
from .bootstrap import ensure_ready
from .ml import inference
from .schemas import ReturnPredictRequest, ReviewPredictRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_ready()
    yield


app = FastAPI(
    title="Intelligent Consumer Trust & Product Risk Assessment API",
    description="Probabilistic ML for trust scoring, return risk, fraud and fake reviews.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/overview")
def overview():
    ov = inference.scores()["overview"]
    return {**ov, "dataset": inference.metrics().get("dataset", {})}


@app.get("/api/products")
def list_products(
    search: str = "",
    category: str = "",
    sort: str = Query("risk", enum=["risk", "trust", "return", "price", "name"]),
    limit: int = 60,
    offset: int = 0,
    session: Session = Depends(db.get_session),
):
    pscores = inference.scores()["products"]
    q = session.query(db.Product)
    if search:
        q = q.filter(db.Product.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(db.Product.category == category)
    products = q.all()

    items = []
    for p in products:
        s = pscores.get(p.id, {})
        items.append({
            "id": p.id, "name": p.name, "category": p.category,
            "price": p.price, "seller_rating": p.seller_rating, "image": p.image,
            "trust": s.get("trust", 50.0), "confidence": s.get("confidence", "Low"),
            "risk_prob": s.get("risk_prob", 0.0), "risk_tier": s.get("risk_tier", "Low"),
            "return_rate": s.get("return_rate", 0.0),
            "n_reviews": s.get("n_reviews", 0),
        })

    reverse = sort in ("risk", "trust", "return", "price")
    key = {"risk": "risk_prob", "trust": "trust", "return": "return_rate",
           "price": "price", "name": "name"}[sort]
    items.sort(key=lambda x: x[key], reverse=reverse and key != "name")
    total = len(items)
    return {"total": total, "items": items[offset:offset + limit]}


@app.get("/api/products/{product_id}")
def product_detail(product_id: int, session: Session = Depends(db.get_session)):
    p = session.get(db.Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    s = inference.scores()["products"].get(product_id, {})
    review_scores = inference.scores()["reviews"]

    reviews = (session.query(db.Review)
               .filter(db.Review.product_id == product_id)
               .order_by(db.Review.timestamp.desc())
               .limit(50).all())
    review_items = [{
        "id": r.id, "rating": r.rating, "text": r.text,
        "verified_purchase": r.verified_purchase, "timestamp": r.timestamp,
        "p_fake": review_scores.get(r.id, 0.0),
    } for r in reviews]

    order_count = session.query(db.Order).filter(db.Order.product_id == product_id).count()

    # explanation narrative
    reasons = []
    if s.get("neg_keyword_ratio", 0) > 0.2:
        reasons.append(f"{s['neg_keyword_ratio']*100:.0f}% of reviews mention defect/complaint keywords.")
    if s.get("return_rate", 0) > 0.25:
        reasons.append(f"Return rate of {s['return_rate']*100:.0f}% is above a healthy threshold.")
    if s.get("defect_reason_ratio", 0) > 0.3:
        reasons.append(f"{s['defect_reason_ratio']*100:.0f}% of returns cite defects or damage.")
    if p.seller_rating < 3.5:
        reasons.append(f"Seller rating is low ({p.seller_rating}).")
    if s.get("trust", 100) < 55:
        reasons.append("Bayesian trust score is below average once fake reviews are down-weighted.")
    if not reasons:
        reasons.append("No strong risk signals — metrics are within healthy ranges.")

    return {
        "product": {"id": p.id, "name": p.name, "category": p.category,
                    "price": p.price, "seller_id": p.seller_id,
                    "seller_rating": p.seller_rating, "image": p.image},
        "scores": s,
        "order_count": order_count,
        "reviews": review_items,
        "risk_reasons": reasons,
    }


@app.get("/api/users")
def list_users(
    tier: str = "",
    search: str = "",
    sort: str = Query("fraud", enum=["fraud", "returns", "orders"]),
    limit: int = 60,
    offset: int = 0,
    session: Session = Depends(db.get_session),
):
    uscores = inference.scores()["users"]
    q = session.query(db.User)
    if search:
        q = q.filter(db.User.name.ilike(f"%{search}%"))
    users = q.all()

    items = []
    for u in users:
        s = uscores.get(u.id, {})
        if tier and s.get("tier") != tier:
            continue
        items.append({
            "id": u.id, "name": u.name, "account_age_days": u.account_age_days,
            "total_orders": u.total_orders, "total_returns": u.total_returns,
            "fraud_prob": s.get("fraud_prob", 0.0), "tier": s.get("tier", "Low"),
            "return_rate": round(s.get("return_rate", 0.0), 3),
            "patterns": [p["name"] for p in s.get("patterns", [])],
        })
    key = {"fraud": "fraud_prob", "returns": "total_returns", "orders": "total_orders"}[sort]
    items.sort(key=lambda x: x[key], reverse=True)
    total = len(items)
    return {"total": total, "items": items[offset:offset + limit]}


@app.get("/api/users/{user_id}")
def user_detail(user_id: int, session: Session = Depends(db.get_session)):
    u = session.get(db.User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    s = inference.scores()["users"].get(user_id, {})

    orders = (session.query(db.Order).filter(db.Order.user_id == user_id)
              .order_by(db.Order.timestamp).all())
    pmap = {p.id: p.name for p in session.query(db.Product).all()}
    order_items = [{
        "id": o.id, "product": pmap.get(o.product_id, f"#{o.product_id}"),
        "price": o.price, "payment_mode": o.payment_mode,
        "discount_pct": o.discount_pct, "returned": o.returned,
        "return_reason": o.return_reason, "days_to_return": o.days_to_return,
        "timestamp": o.timestamp,
    } for o in orders]

    # linked accounts sharing device or address
    linked = (session.query(db.User)
              .filter(or_(db.User.device_id == u.device_id,
                          db.User.address_hash == u.address_hash))
              .filter(db.User.id != u.id).all())
    uscores = inference.scores()["users"]
    linked_items = [{
        "id": lu.id, "name": lu.name,
        "shares_device": lu.device_id == u.device_id,
        "shares_address": lu.address_hash == u.address_hash,
        "fraud_prob": uscores.get(lu.id, {}).get("fraud_prob", 0.0),
    } for lu in linked]

    # monthly order/return timeline
    timeline: dict[str, dict] = {}
    for o in orders:
        m = o.timestamp[:7]
        t = timeline.setdefault(m, {"month": m, "orders": 0, "returns": 0})
        t["orders"] += 1
        if o.returned:
            t["returns"] += 1

    return {
        "user": {"id": u.id, "name": u.name, "account_age_days": u.account_age_days,
                 "total_orders": u.total_orders, "total_returns": u.total_returns,
                 "device_id": u.device_id, "address_hash": u.address_hash,
                 "coupon_uses": u.coupon_uses},
        "scores": s,
        "orders": order_items,
        "linked_accounts": linked_items,
        "timeline": sorted(timeline.values(), key=lambda x: x["month"]),
    }


@app.post("/api/predict/return")
def predict_return(req: ReturnPredictRequest):
    return inference.predict_return(req.model_dump())


@app.post("/api/predict/review")
def predict_review(req: ReviewPredictRequest):
    return inference.predict_review(req.text, req.rating, req.verified_purchase)


@app.get("/api/models/metrics")
def model_metrics():
    return inference.metrics()
