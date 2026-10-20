"""Fake-review detector.

Architecture (matches the probabilistic brief):

1. A ComplementNB classifier over TF-IDF text features produces P_text(fake).
   Out-of-fold predictions are used at training time so the stacked model does
   not see leaked in-sample probabilities.
2. A LogisticRegression combines P_text with behavioural features (burst score,
   rating deviation from the product mean, verified flag, text length, generic
   wording, punctuation). It is wrapped in CalibratedClassifierCV so the final
   P(fake) is well-calibrated.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_predict
from sklearn.naive_bayes import ComplementNB

from .text_features import add_burst_scores, text_stats

BEHAV_COLS = ["p_text", "char_len", "word_count", "unique_ratio", "exclaim",
              "caps_ratio", "generic_ratio", "risk_hits", "rating_dev",
              "verified", "burst"]


def build_frame(reviews: pd.DataFrame) -> pd.DataFrame:
    """Create the behavioural feature frame (everything except p_text)."""
    stats = reviews["text"].apply(text_stats).apply(pd.Series)
    prod_mean = reviews.groupby("product_id")["rating"].transform("mean")
    frame = pd.DataFrame(index=reviews.index)
    frame["char_len"] = stats["char_len"]
    frame["word_count"] = stats["word_count"]
    frame["unique_ratio"] = stats["unique_ratio"]
    frame["exclaim"] = stats["exclaim"]
    frame["caps_ratio"] = stats["caps_ratio"]
    frame["generic_ratio"] = stats["generic_ratio"]
    frame["risk_hits"] = stats["risk_hits"]
    frame["rating_dev"] = (reviews["rating"] - prod_mean).abs()
    frame["verified"] = reviews["verified_purchase"].astype(int)
    frame["burst"] = add_burst_scores(reviews)
    return frame


class FakeReviewModel:
    def __init__(self):
        self.tfidf = TfidfVectorizer(max_features=1500, ngram_range=(1, 2),
                                     min_df=2, sublinear_tf=True)
        self.nb = ComplementNB()
        self.clf = CalibratedClassifierCV(
            LogisticRegression(max_iter=1000, class_weight="balanced"),
            method="sigmoid", cv=5)

    def fit(self, reviews: pd.DataFrame, y) -> "FakeReviewModel":
        y = np.asarray(y).astype(int)
        X_text = self.tfidf.fit_transform(reviews["text"])
        # out-of-fold text probabilities to avoid leakage in the stack
        p_text_oof = cross_val_predict(ComplementNB(), X_text, y, cv=5,
                                       method="predict_proba")[:, 1]
        self.nb.fit(X_text, y)  # refit on all data for serving

        frame = build_frame(reviews).copy()
        frame.insert(0, "p_text", p_text_oof)
        self.clf.fit(frame[BEHAV_COLS].to_numpy(), y)
        return self

    def _assemble(self, reviews: pd.DataFrame) -> np.ndarray:
        X_text = self.tfidf.transform(reviews["text"])
        p_text = self.nb.predict_proba(X_text)[:, 1]
        frame = build_frame(reviews).copy()
        frame.insert(0, "p_text", p_text)
        return frame[BEHAV_COLS].to_numpy()

    def predict_proba(self, reviews: pd.DataFrame) -> np.ndarray:
        return self.clf.predict_proba(self._assemble(reviews))[:, 1]

    def explain_one(self, text: str, rating: int, verified: bool,
                    product_mean: float = 3.5, burst: float = 1.0) -> dict:
        row = pd.DataFrame([{
            "user_id": 0, "product_id": 0, "text": text, "rating": rating,
            "verified_purchase": bool(verified), "timestamp": "2024-01-01 00:00:00",
        }])
        # burst cannot be inferred for a single pasted review
        frame = build_frame(row)
        frame["burst"] = burst
        frame["rating_dev"] = abs(rating - product_mean)
        X_text = self.tfidf.transform(row["text"])
        p_text = float(self.nb.predict_proba(X_text)[:, 1][0])
        frame.insert(0, "p_text", p_text)
        prob = float(self.clf.predict_proba(frame[BEHAV_COLS].to_numpy())[:, 1][0])

        st = text_stats(text)
        reasons = []
        if st["word_count"] <= 4:
            reasons.append("Very short review (little genuine detail)")
        if st["generic_ratio"] > 0.4:
            reasons.append("Mostly generic praise words")
        if st["unique_ratio"] < 0.6 and st["word_count"] > 3:
            reasons.append("Repetitive wording")
        if rating in (1, 5):
            reasons.append("Extreme rating with little justification")
        if not verified:
            reasons.append("Not a verified purchase")
        if st["exclaim"] >= 2:
            reasons.append("Excessive punctuation")
        if p_text > 0.6:
            reasons.append("Wording statistically similar to known fake reviews")
        if not reasons:
            reasons.append("Balanced, specific wording consistent with genuine reviews")
        return {"p_text": round(p_text, 3), "reasons": reasons, "prob": prob}
