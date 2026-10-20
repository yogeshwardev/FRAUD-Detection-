"""Runtime inference: loads trained artifacts and serves live predictions."""
from __future__ import annotations

import json

import numpy as np

from ..database import ARTIFACT_DIR
from .pipeline import (
    CATEGORIES,
    METRICS_PATH,
    MODELS_PATH,
    RETURN_FEATURES,
    SCORES_PATH,
    _bayes_rate,
)

import joblib

_STATE: dict = {}


def artifacts_exist() -> bool:
    return MODELS_PATH.exists() and SCORES_PATH.exists() and METRICS_PATH.exists()


def load() -> None:
    _STATE["models"] = joblib.load(MODELS_PATH)
    _STATE["scores"] = joblib.load(SCORES_PATH)
    _STATE["metrics"] = json.loads(METRICS_PATH.read_text())


def _ensure():
    if not _STATE:
        load()


def scores() -> dict:
    _ensure()
    return _STATE["scores"]


def metrics() -> dict:
    _ensure()
    return _STATE["metrics"]


def models() -> dict:
    _ensure()
    return _STATE["models"]


# --------------------------------------------------------------------------- #
# Live return-risk prediction
# --------------------------------------------------------------------------- #
_RETURN_LABELS = {
    "price": "Order value",
    "discount_pct": "Discount depth",
    "delivery_days": "Delivery time",
    "cod": "Cash-on-delivery payment",
    "user_return_rate": "Customer's return history",
    "product_return_rate": "Category return history",
    "size_complaint_ratio": "Size-complaint rate",
}


def _return_vector(payload: dict) -> tuple[np.ndarray, dict]:
    ctx = models()["return_ctx"]
    cat = payload["category"]
    price = float(payload["price"])
    discount = float(payload["discount_pct"])
    delivery = int(payload["delivery_days"])
    cod = 1 if str(payload["payment_mode"]).upper() == "COD" else 0

    user_id = payload.get("user_id")
    if user_id is not None and int(user_id) in ctx["user_return_rate"]:
        user_rr = ctx["user_return_rate"][int(user_id)]
    else:
        user_rr = ctx["prior_return_rate"]
    prod_rr = ctx["cat_product_return_rate"].get(cat, ctx["prior_return_rate"])
    size_ratio = ctx["cat_size_complaint_ratio"].get(cat, 0.0)

    row = {
        "price": price, "discount_pct": discount, "delivery_days": delivery,
        "cod": cod, "user_return_rate": user_rr, "product_return_rate": prod_rr,
        "size_complaint_ratio": size_ratio,
    }
    for c in CATEGORIES:
        row[f"cat_{c}"] = 1 if cat == c else 0
    vec = np.array([[row[f] for f in RETURN_FEATURES]], dtype=float)
    return vec, row


def _linear_contributions(vec: np.ndarray) -> np.ndarray | None:
    """Average log-odds contributions from the calibrated logistic base models."""
    model = models()["return_risk"]
    if models().get("return_best") != "logistic":
        return None
    coefs, means, scales = [], [], []
    for cc in getattr(model, "calibrated_classifiers_", []):
        pipe = getattr(cc, "estimator", None)
        if pipe is None:
            continue
        lr = pipe.named_steps["lr"]
        sc = pipe.named_steps["scale"]
        coefs.append(lr.coef_[0])
        means.append(sc.mean_)
        scales.append(sc.scale_)
    if not coefs:
        return None
    coef = np.mean(coefs, axis=0)
    mean = np.mean(means, axis=0)
    scale = np.mean(scales, axis=0)
    standardized = (vec[0] - mean) / scale
    return coef * standardized


def predict_return(payload: dict) -> dict:
    vec, row = _return_vector(payload)
    model = models()["return_risk"]
    prob = float(model.predict_proba(vec)[:, 1][0])

    contrib = _linear_contributions(vec)
    factors = []
    if contrib is not None:
        # group the 6 one-hot category columns into one "Product category" factor
        base = contrib[:len(_RETURN_LABELS)]
        cat_contrib = float(np.sum(contrib[len(_RETURN_LABELS):]))
        items = [(_RETURN_LABELS[RETURN_FEATURES[i]], float(base[i]))
                 for i in range(len(_RETURN_LABELS))]
        items.append(("Product category", cat_contrib))
        items.sort(key=lambda x: abs(x[1]), reverse=True)
        factors = [{"factor": n, "impact": round(v, 3),
                    "direction": "increases" if v > 0 else "decreases"}
                   for n, v in items[:6]]
    else:
        # heuristic fallback (used only if Gaussian NB wins)
        heur = [
            ("Cash-on-delivery payment", row["cod"] * 0.8),
            ("Discount depth", row["discount_pct"] / 100 * 0.9),
            ("Customer's return history", row["user_return_rate"] * 1.2),
            ("Category return history", row["product_return_rate"] * 1.1),
            ("Size-complaint rate", row["size_complaint_ratio"] * 0.7),
            ("Delivery time", max(0, row["delivery_days"] - 7) / 10 * 0.6),
        ]
        heur.sort(key=lambda x: abs(x[1]), reverse=True)
        factors = [{"factor": n, "impact": round(v, 3),
                    "direction": "increases" if v > 0 else "decreases"}
                   for n, v in heur[:6]]

    if prob >= 0.7:
        tier, action = "High", "Require prepaid payment and show the size guide before checkout."
    elif prob >= 0.4:
        tier, action = "Medium", "Send a fit/size confirmation prompt before dispatch."
    else:
        tier, action = "Low", "Normal processing — no intervention needed."

    return {
        "probability": round(prob, 4),
        "tier": tier,
        "action": action,
        "factors": factors,
        "inputs": {k: row[k] for k in _RETURN_LABELS},
    }


def predict_review(text: str, rating: int, verified: bool,
                   product_mean: float = 3.5) -> dict:
    model = models()["fake_review"]
    res = model.explain_one(text, rating, verified, product_mean=product_mean)
    prob = res["prob"]
    # highlight suspicious tokens
    from .text_features import _GENERIC, risk_keyword_hits, tokenize
    suspicious = sorted({t for t in tokenize(text) if t in _GENERIC})
    confidence = "High" if (prob > 0.75 or prob < 0.25) else "Medium" if (
        prob > 0.6 or prob < 0.4) else "Low"
    return {
        "probability": round(prob, 4),
        "tier": "Likely Fake" if prob >= 0.5 else "Likely Genuine",
        "confidence": confidence,
        "reasons": res["reasons"],
        "suspicious_words": suspicious,
        "risk_keywords": risk_keyword_hits(text),
        "text_prob": res["p_text"],
    }
