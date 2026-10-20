"""End-to-end training pipeline.

Builds feature frames for every task, trains the probabilistic models, computes
honest held-out metrics (plus non-probabilistic baselines), and precomputes the
per-entity scores the API serves. Artifacts are persisted with joblib so the
demo starts instantly on subsequent runs.
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC

from ..database import ARTIFACT_DIR
from .fake_review import FakeReviewModel
from .metrics import evaluate
from .text_features import RISK_KEYWORDS, risk_keyword_hits
from .trust import compute_trust

import joblib

MODELS_PATH = ARTIFACT_DIR / "models.joblib"
SCORES_PATH = ARTIFACT_DIR / "scores.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"

CATEGORIES = ["Fashion", "Footwear", "Electronics", "Home", "Beauty", "Toys"]

RETURN_NUM = ["price", "discount_pct", "delivery_days", "cod",
              "user_return_rate", "product_return_rate", "size_complaint_ratio"]
RETURN_FEATURES = RETURN_NUM + [f"cat_{c}" for c in CATEGORIES]

FRAUD_FEATURES = ["return_rate_bayes", "returns_within_3", "shared_device_count",
                  "shared_address_count", "review_burst", "coupon_per_order",
                  "account_age_days", "total_orders", "iso_score"]

PRISK_FEATURES = ["neg_keyword_ratio", "return_rate", "defect_reason_ratio",
                  "seller_rating", "trust"]

# Beta priors for smoothing rates (prior belief: returns are uncommon)
RR_PRIOR_A, RR_PRIOR_B = 1.0, 4.0


def _bayes_rate(success, total, a=RR_PRIOR_A, b=RR_PRIOR_B):
    return (success + a) / (total + a + b)


def _calibrated_lr():
    pipe = Pipeline([("scale", StandardScaler()),
                     ("lr", LogisticRegression(max_iter=1000, class_weight="balanced"))])
    return CalibratedClassifierCV(pipe, method="sigmoid", cv=5)


def _baseline_svm(X_train, y_train, X_test, y_test):
    svm = Pipeline([("scale", StandardScaler()), ("svc", LinearSVC(class_weight="balanced"))])
    svm.fit(X_train, y_train)
    score = svm.decision_function(X_test)
    # min-max to [0,1] purely so a comparable probability-like score exists
    rng = score.max() - score.min()
    prob = (score - score.min()) / rng if rng else np.full_like(score, 0.5, dtype=float)
    m = evaluate(y_test, prob)
    m["model"] = "Linear SVM (uncalibrated baseline)"
    m["note"] = "No native probabilities — scores min-max scaled; not calibrated."
    return m


# --------------------------------------------------------------------------- #
# Feature construction
# --------------------------------------------------------------------------- #
def _product_aggregates(data, review_fake_prob):
    products, orders, reviews = data["products"], data["orders"], data["reviews"]
    reviews = reviews.copy()
    reviews["p_fake"] = review_fake_prob

    o_by_p = orders.groupby("product_id")
    order_count = o_by_p.size()
    return_count = o_by_p["returned"].sum()
    defect_mask = orders["returned"] & orders["return_reason"].isin(
        ["Defective product", "Damaged on arrival", "Quality not good"])
    defect_count = orders[defect_mask].groupby("product_id").size()

    r_by_p = reviews.groupby("product_id")
    agg = {}
    for pid in products["id"]:
        oc = int(order_count.get(pid, 0))
        rc = int(return_count.get(pid, 0))
        dc = int(defect_count.get(pid, 0))
        prod_reviews = r_by_p.get_group(pid) if pid in r_by_p.groups else reviews.iloc[0:0]
        n_rev = len(prod_reviews)
        neg_kw = sum(1 for t in prod_reviews["text"] if risk_keyword_hits(t))
        trust = compute_trust(prod_reviews["rating"], prod_reviews["p_fake"])
        agg[pid] = {
            "order_count": oc,
            "return_count": rc,
            "return_rate": (rc / oc) if oc else 0.0,
            "return_rate_bayes": _bayes_rate(rc, oc),
            "defect_reason_ratio": (dc / rc) if rc else 0.0,
            "neg_keyword_ratio": (neg_kw / n_rev) if n_rev else 0.0,
            "n_reviews": n_rev,
            "trust": trust,
        }
    return agg, reviews


def _user_aggregates(data):
    users, orders, reviews = data["users"], data["orders"], data["reviews"]
    o_by_u = orders.groupby("user_id")
    device_counts = users.groupby("device_id")["id"].transform("size")
    addr_counts = users.groupby("address_hash")["id"].transform("size")
    users = users.copy()
    users["device_share"] = device_counts.values
    users["addr_share"] = addr_counts.values

    # review burst: max reviews posted by a user on a single day
    rday = reviews["timestamp"].str.slice(0, 10)
    burst = reviews.groupby(["user_id", rday]).size().groupby(level=0).max()

    agg = {}
    for _, u in users.iterrows():
        uid = int(u["id"])
        grp = o_by_u.get_group(uid) if uid in o_by_u.groups else orders.iloc[0:0]
        oc = len(grp)
        rc = int(grp["returned"].sum())
        within3 = int(((grp["returned"]) & (grp["days_to_return"] <= 3)).sum())
        agg[uid] = {
            "order_count": oc,
            "return_count": rc,
            "return_rate": (rc / oc) if oc else 0.0,
            "return_rate_bayes": _bayes_rate(rc, oc),
            "returns_within_3": within3,
            "shared_device_count": int(u["device_share"]) - 1,
            "shared_address_count": int(u["addr_share"]) - 1,
            "review_burst": int(burst.get(uid, 0)),
            "coupon_per_order": u["coupon_uses"] / (oc + 1),
            "account_age_days": int(u["account_age_days"]),
            "total_orders": oc,
        }
    return agg


def _build_return_frame(data):
    products = data["products"].set_index("id")
    orders = data["orders"]
    uagg = {u: v for u, v in _user_aggregates(data).items()}
    pagg, _ = _product_aggregates(data, np.zeros(len(data["reviews"])))

    rows = []
    for _, o in orders.iterrows():
        pid = int(o["product_id"])
        uid = int(o["user_id"])
        cat = products.loc[pid, "category"]
        row = {
            "price": float(o["price"]),
            "discount_pct": float(o["discount_pct"]),
            "delivery_days": int(o["delivery_days"]),
            "cod": 1 if o["payment_mode"] == "COD" else 0,
            "user_return_rate": uagg[uid]["return_rate_bayes"],
            "product_return_rate": pagg[pid]["return_rate_bayes"],
            "size_complaint_ratio": _size_ratio(pid, orders),
        }
        for c in CATEGORIES:
            row[f"cat_{c}"] = 1 if cat == c else 0
        rows.append(row)
    X = pd.DataFrame(rows)[RETURN_FEATURES]
    y = orders["returned"].astype(int).to_numpy()
    return X, y


_size_cache: dict | None = None


def _size_ratio(pid, orders):
    global _size_cache
    if _size_cache is None:
        ret = orders[orders["returned"]]
        size_mask = ret["return_reason"].astype(str).str.contains("Size|fit|size chart",
                                                                   case=False, na=False)
        size_ret = ret[size_mask].groupby("product_id").size()
        all_ret = ret.groupby("product_id").size()
        _size_cache = {}
        for p in orders["product_id"].unique():
            a = int(size_ret.get(p, 0))
            b = int(all_ret.get(p, 0))
            _size_cache[int(p)] = (a / b) if b else 0.0
    return _size_cache.get(int(pid), 0.0)


# --------------------------------------------------------------------------- #
# Main training
# --------------------------------------------------------------------------- #
def train_all(data: dict[str, pd.DataFrame]) -> dict:
    global _size_cache
    _size_cache = None
    products, users, orders, reviews = (data["products"], data["users"],
                                        data["orders"], data["reviews"])
    metrics: dict = {}
    models: dict = {}

    # ---- A. Fake review detection ---------------------------------------- #
    y_fake = reviews["is_fake"].astype(int).to_numpy()
    idx = np.arange(len(reviews))
    tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=y_fake)
    fr_eval = FakeReviewModel().fit(reviews.iloc[tr], y_fake[tr])
    p_test = fr_eval.predict_proba(reviews.iloc[te])
    m_fake = evaluate(y_fake[te], p_test)
    m_fake["model"] = "ComplementNB (text) + Calibrated Logistic (behaviour)"
    # baseline: plain SVM on behavioural features only
    from .fake_review import BEHAV_COLS, build_frame
    bframe = build_frame(reviews)
    bframe.insert(0, "p_text", 0.0)
    base_fake = _baseline_svm(bframe[BEHAV_COLS].to_numpy()[tr], y_fake[tr],
                              bframe[BEHAV_COLS].to_numpy()[te], y_fake[te])
    metrics["fake_review"] = {"primary": m_fake, "baseline": base_fake}

    fr_final = FakeReviewModel().fit(reviews, y_fake)
    review_fake_prob = fr_final.predict_proba(reviews)
    models["fake_review"] = fr_final

    # ---- product & user aggregates (reuse the calibrated fake probs) ------ #
    pagg, reviews_scored = _product_aggregates(data, review_fake_prob)
    uagg = _user_aggregates(data)

    # ---- C. Return risk --------------------------------------------------- #
    Xr, yr = _build_return_frame(data)
    Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, yr, test_size=0.25,
                                                  random_state=42, stratify=yr)
    lr_ret = _calibrated_lr().fit(Xr_tr.to_numpy(), yr_tr)
    gnb_ret = GaussianNB().fit(Xr_tr.to_numpy(), yr_tr)
    m_lr = evaluate(yr_te, lr_ret.predict_proba(Xr_te.to_numpy())[:, 1])
    m_lr["model"] = "Calibrated Logistic Regression"
    m_gnb = evaluate(yr_te, gnb_ret.predict_proba(Xr_te.to_numpy())[:, 1])
    m_gnb["model"] = "Gaussian Naive Bayes"
    best_ret_name = "logistic" if m_lr["roc_auc"] >= m_gnb["roc_auc"] else "gaussian_nb"
    base_ret = _baseline_svm(Xr_tr.to_numpy(), yr_tr, Xr_te.to_numpy(), yr_te)
    metrics["return_risk"] = {"logistic": m_lr, "gaussian_nb": m_gnb,
                              "baseline": base_ret, "best": best_ret_name}
    ret_final = _calibrated_lr().fit(Xr.to_numpy(), yr) if best_ret_name == "logistic" \
        else GaussianNB().fit(Xr.to_numpy(), yr)
    models["return_risk"] = ret_final
    models["return_best"] = best_ret_name

    # ---- D. Fraud user detection ----------------------------------------- #
    fraud_rows = pd.DataFrame([uagg[int(u)] for u in users["id"]], index=users["id"])
    y_fraud = users["is_fraud"].astype(int).to_numpy()
    iso = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    base_feats = ["return_rate_bayes", "returns_within_3", "shared_device_count",
                  "shared_address_count", "review_burst", "coupon_per_order",
                  "account_age_days", "total_orders"]
    iso.fit(fraud_rows[base_feats].to_numpy())
    iso_score = -iso.score_samples(fraud_rows[base_feats].to_numpy())  # higher = more anomalous
    fraud_rows["iso_score"] = iso_score

    Xf = fraud_rows[FRAUD_FEATURES].to_numpy()
    Xf_tr, Xf_te, yf_tr, yf_te, iso_tr, iso_te = train_test_split(
        Xf, y_fraud, iso_score, test_size=0.25, random_state=42, stratify=y_fraud)
    fraud_lr = _calibrated_lr().fit(Xf_tr, yf_tr)
    m_fraud = evaluate(yf_te, fraud_lr.predict_proba(Xf_te)[:, 1])
    m_fraud["model"] = "Isolation Forest + Calibrated Logistic"
    # baseline: naive rule — flag if raw return rate >= 0.5 (ignores evidence volume)
    naive_pred = (fraud_rows["return_rate_bayes"].to_numpy() >= 0.5).astype(float)
    base_fraud = evaluate(y_fraud, naive_pred)
    base_fraud["model"] = "Naive rule: return rate >= 50%"
    base_fraud["note"] = "Flags anyone with a high return ratio regardless of evidence."
    metrics["fraud"] = {"primary": m_fraud, "baseline": base_fraud}
    fraud_final = _calibrated_lr().fit(Xf, y_fraud)
    models["fraud"] = fraud_final
    models["fraud_iso"] = iso
    models["fraud_base_feats"] = base_feats

    # ---- E. Product risk -------------------------------------------------- #
    prod_feat_rows = []
    for pid in products["id"]:
        a = pagg[int(pid)]
        srating = float(products.set_index("id").loc[pid, "seller_rating"])
        prod_feat_rows.append({
            "neg_keyword_ratio": a["neg_keyword_ratio"],
            "return_rate": a["return_rate"],
            "defect_reason_ratio": a["defect_reason_ratio"],
            "seller_rating": srating,
            "trust": a["trust"].trust / 100.0,
        })
    Xp = pd.DataFrame(prod_feat_rows)[PRISK_FEATURES]
    yp = products["is_risky"].astype(int).to_numpy()
    Xp_tr, Xp_te, yp_tr, yp_te = train_test_split(Xp, yp, test_size=0.25,
                                                  random_state=42, stratify=yp)
    prisk = _calibrated_lr().fit(Xp_tr.to_numpy(), yp_tr)
    m_prisk = evaluate(yp_te, prisk.predict_proba(Xp_te.to_numpy())[:, 1])
    m_prisk["model"] = "Calibrated Logistic Regression"
    gnb_prisk = GaussianNB().fit(Xp_tr.to_numpy(), yp_tr)
    m_prisk_gnb = evaluate(yp_te, gnb_prisk.predict_proba(Xp_te.to_numpy())[:, 1])
    m_prisk_gnb["model"] = "Gaussian Naive Bayes"
    base_prisk = _baseline_svm(Xp_tr.to_numpy(), yp_tr, Xp_te.to_numpy(), yp_te)
    metrics["product_risk"] = {"primary": m_prisk, "gaussian_nb": m_prisk_gnb,
                               "baseline": base_prisk}
    prisk_final = _calibrated_lr().fit(Xp.to_numpy(), yp)
    prod_risk_prob = prisk_final.predict_proba(Xp.to_numpy())[:, 1]
    models["product_risk"] = prisk_final

    # ---- precompute per-entity scores ------------------------------------ #
    scores = _precompute_scores(data, pagg, uagg, fraud_rows, fraud_final,
                                prod_risk_prob, ret_final, best_ret_name,
                                review_fake_prob, reviews_scored)

    # ---- probabilistic-vs-traditional narrative -------------------------- #
    metrics["comparison"] = _comparison_examples(data, uagg, pagg)
    metrics["dataset"] = {
        "products": len(products), "users": len(users),
        "orders": len(orders), "reviews": len(reviews),
        "fraud_users": int(users["is_fraud"].sum()),
        "fake_reviews": int(reviews["is_fake"].sum()),
        "risky_products": int(products["is_risky"].sum()),
    }

    # ---- persist ---------------------------------------------------------- #
    # category-level averages for the live predictor (the form picks a category,
    # not a specific product)
    pcat = {int(p): c for p, c in zip(products["id"], products["category"])}
    cat_prr, cat_size = {}, {}
    for c in CATEGORIES:
        pids = [pid for pid, cc in pcat.items() if cc == c]
        cat_prr[c] = float(np.mean([pagg[pid]["return_rate_bayes"] for pid in pids])) if pids else _bayes_rate(0, 0)
        cat_size[c] = float(np.mean([_size_ratio(pid, orders) for pid in pids])) if pids else 0.0

    models["return_feature_names"] = RETURN_FEATURES
    models["fraud_feature_names"] = FRAUD_FEATURES
    models["return_ctx"] = {
        "user_return_rate": {int(u): uagg[int(u)]["return_rate_bayes"] for u in users["id"]},
        "product_return_rate": {int(p): pagg[int(p)]["return_rate_bayes"] for p in products["id"]},
        "size_complaint_ratio": {int(p): _size_ratio(int(p), orders) for p in products["id"]},
        "product_category": pcat,
        "cat_product_return_rate": cat_prr,
        "cat_size_complaint_ratio": cat_size,
        "prior_return_rate": _bayes_rate(0, 0),
    }
    joblib.dump(models, MODELS_PATH)
    joblib.dump(scores, SCORES_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return {"models": models, "scores": scores, "metrics": metrics}


def _tier(prob: float) -> str:
    if prob >= 0.7:
        return "High"
    if prob >= 0.4:
        return "Medium"
    return "Low"


def _fraud_patterns(a: dict, prob: float) -> list[dict]:
    pats = []
    if a["return_rate_bayes"] > 0.5 and a["total_orders"] >= 3:
        pats.append({"name": "Return Abuse",
                     "evidence": f"{a['return_rate_bayes']*100:.0f}% smoothed return rate "
                                 f"over {a['total_orders']} orders"})
    if a["returns_within_3"] >= 3:
        pats.append({"name": "Wardrobing",
                     "evidence": f"{a['returns_within_3']} items returned within 3 days "
                                 f"(buy-use-return pattern)"})
    if a["shared_device_count"] >= 1 or a["shared_address_count"] >= 1:
        pats.append({"name": "Multi-Account",
                     "evidence": f"Shares device with {a['shared_device_count']} and "
                                 f"address with {a['shared_address_count']} other accounts"})
    if a["review_burst"] >= 3:
        pats.append({"name": "Fake Reviewer",
                     "evidence": f"Posted {a['review_burst']} reviews in a single day (burst)"})
    if a["coupon_per_order"] > 1.5:
        pats.append({"name": "Coupon Abuse",
                     "evidence": f"{a['coupon_per_order']:.1f} coupon uses per order"})
    return pats


def _precompute_scores(data, pagg, uagg, fraud_rows, fraud_final, prod_risk_prob,
                       ret_final, best_ret_name, review_fake_prob, reviews_scored):
    products, users, orders, reviews = (data["products"], data["users"],
                                        data["orders"], data["reviews"])
    fraud_prob = fraud_final.predict_proba(fraud_rows[FRAUD_FEATURES].to_numpy())[:, 1]
    fraud_prob_map = {int(u): float(p) for u, p in zip(users["id"], fraud_prob)}

    user_scores = {}
    for uid in users["id"]:
        uid = int(uid)
        a = uagg[uid]
        prob = fraud_prob_map[uid]
        user_scores[uid] = {
            **{k: (round(v, 4) if isinstance(v, float) else v) for k, v in a.items()},
            "fraud_prob": round(prob, 4),
            "tier": _tier(prob),
            "patterns": _fraud_patterns(a, prob),
            "iso_score": round(float(fraud_rows.loc[uid, "iso_score"]), 4),
        }

    prod_risk_map = {int(p): float(v) for p, v in zip(products["id"], prod_risk_prob)}
    product_scores = {}
    for pid in products["id"]:
        pid = int(pid)
        a = pagg[pid]
        t = a["trust"]
        product_scores[pid] = {
            "trust": t.trust, "trust_low": t.low, "trust_high": t.high,
            "confidence": t.confidence, "naive_rating": t.naive_rating,
            "bayesian_rating": t.bayesian_rating, "n_reviews": t.n_reviews,
            "risk_prob": round(prod_risk_map[pid], 4),
            "risk_tier": _tier(prod_risk_map[pid]),
            "return_rate": round(a["return_rate"], 4),
            "return_rate_bayes": round(a["return_rate_bayes"], 4),
            "neg_keyword_ratio": round(a["neg_keyword_ratio"], 4),
            "defect_reason_ratio": round(a["defect_reason_ratio"], 4),
            "order_count": a["order_count"],
        }

    review_fake_map = {int(r): round(float(p), 4)
                       for r, p in zip(reviews["id"], review_fake_prob)}

    overview = _build_overview(data, product_scores, user_scores, review_fake_map)
    return {"users": user_scores, "products": product_scores,
            "reviews": review_fake_map, "overview": overview}


def _build_overview(data, product_scores, user_scores, review_fake_map):
    products, users, orders, reviews = (data["products"], data["users"],
                                        data["orders"], data["reviews"])
    avg_trust = round(float(np.mean([s["trust"] for s in product_scores.values()])), 1)
    pred_return_rate = round(float(orders["returned"].mean()) * 100, 1)
    fraud_flagged = sum(1 for s in user_scores.values() if s["tier"] in ("High", "Medium"))
    high_risk_products = sum(1 for s in product_scores.values() if s["risk_tier"] == "High")
    fake_reviews = sum(1 for p in review_fake_map.values() if p >= 0.5)

    # return risk by category
    cat_map = dict(zip(products["id"], products["category"]))
    orders = orders.copy()
    orders["category"] = orders["product_id"].map(cat_map)
    by_cat = (orders.groupby("category")["returned"].mean() * 100).round(1)
    return_by_category = [{"category": c, "rate": float(by_cat.get(c, 0))}
                          for c in ["Fashion", "Footwear", "Electronics", "Home", "Beauty", "Toys"]]

    # fraud tier distribution
    tiers = {"Low": 0, "Medium": 0, "High": 0}
    for s in user_scores.values():
        tiers[s["tier"]] += 1
    fraud_tiers = [{"tier": k, "count": v} for k, v in tiers.items()]

    # trust distribution histogram
    trust_vals = [s["trust"] for s in product_scores.values()]
    hist, edges = np.histogram(trust_vals, bins=10, range=(0, 100))
    trust_hist = [{"bucket": f"{int(edges[i])}-{int(edges[i+1])}", "count": int(hist[i])}
                  for i in range(len(hist))]

    # returns over time (monthly)
    month = orders["timestamp"].str.slice(0, 7)
    trend = orders.groupby(month).agg(orders=("id", "size"),
                                      returns=("returned", "sum")).reset_index()
    trend.columns = ["month", "orders", "returns"]
    returns_trend = [{"month": r["month"], "orders": int(r["orders"]),
                      "returns": int(r["returns"]),
                      "rate": round(r["returns"] / r["orders"] * 100, 1) if r["orders"] else 0}
                     for _, r in trend.iterrows()]

    # top risky products / suspicious users
    pname = dict(zip(products["id"], products["name"]))
    pcat = dict(zip(products["id"], products["category"]))
    top_products = sorted(product_scores.items(), key=lambda kv: kv[1]["risk_prob"],
                          reverse=True)[:10]
    top_risky = [{"id": pid, "name": pname[pid], "category": pcat[pid],
                  "risk_prob": s["risk_prob"], "trust": s["trust"],
                  "return_rate": s["return_rate"]} for pid, s in top_products]

    uname = dict(zip(users["id"], users["name"]))
    top_users = sorted(user_scores.items(), key=lambda kv: kv[1]["fraud_prob"],
                       reverse=True)[:10]
    top_fraud = [{"id": uid, "name": uname[uid], "fraud_prob": s["fraud_prob"],
                  "tier": s["tier"], "return_rate": round(s["return_rate"], 3),
                  "patterns": [p["name"] for p in s["patterns"]]}
                 for uid, s in top_users]

    return {
        "kpis": {
            "avg_trust": avg_trust,
            "pred_return_rate": pred_return_rate,
            "fraud_flagged": fraud_flagged,
            "high_risk_products": high_risk_products,
            "fake_reviews": fake_reviews,
            "total_products": len(products),
            "total_users": len(users),
            "total_orders": len(orders),
            "total_reviews": len(reviews),
        },
        "return_by_category": return_by_category,
        "fraud_tiers": fraud_tiers,
        "trust_hist": trust_hist,
        "returns_trend": returns_trend,
        "top_risky_products": top_risky,
        "top_fraud_users": top_fraud,
    }


def _comparison_examples(data, uagg, pagg):
    """Concrete examples that show why probability + uncertainty beats point
    estimates (the classic 1-order-1-return case, and fake-review-inflated trust)."""
    users = data["users"]
    # find a genuine user with exactly 1 order and 1 return
    example_user = None
    for uid in users["id"]:
        a = uagg[int(uid)]
        if a["total_orders"] == 1 and a["return_count"] == 1 and not bool(
                users.set_index("id").loc[uid, "is_fraud"]):
            example_user = {
                "user_id": int(uid),
                "naive_return_rate": 100.0,
                "bayes_return_rate": round(a["return_rate_bayes"] * 100, 1),
                "explanation": "A naive 100% return rate would flag this shopper as a "
                               "fraudster. With a Beta prior, one order gives almost no "
                               "evidence, so the smoothed rate stays near the population "
                               "average and the user is correctly NOT flagged.",
            }
            break

    # a product whose naive rating is inflated vs bayesian (fake-weighted)
    best = None
    for pid, a in pagg.items():
        t = a["trust"]
        if t.n_reviews >= 5:
            gap = t.naive_rating - t.bayesian_rating
            if best is None or gap > best["gap"]:
                best = {"product_id": pid, "gap": round(gap, 2),
                        "naive_rating": t.naive_rating,
                        "bayesian_rating": t.bayesian_rating,
                        "confidence": t.confidence}
    return {"one_order_one_return": example_user, "trust_gap_example": best}
