"""Lightweight NLP / text feature helpers used by review-based models."""
from __future__ import annotations

import re

import numpy as np
import pandas as pd

RISK_KEYWORDS = ["broke", "burnt", "burning", "leaking", "leak", "fake", "stopped working",
                 "defective", "defect", "cheap quality", "fell apart", "dangerous",
                 "overheated", "overheat", "damaged", "not working", "worst", "useless",
                 "poor quality", "terrible", "waste"]

_GENERIC = {"nice", "good", "super", "best", "awesome", "amazing", "great", "loved",
            "excellent", "fantastic", "worst", "quality", "product", "buy", "value"}

_token_re = re.compile(r"[a-zA-Z']+")


def tokenize(text: str) -> list[str]:
    return _token_re.findall((text or "").lower())


def risk_keyword_hits(text: str) -> list[str]:
    t = (text or "").lower()
    return [k for k in RISK_KEYWORDS if k in t]


def text_stats(text: str) -> dict:
    text = text or ""
    tokens = tokenize(text)
    n = len(tokens)
    uniq = len(set(tokens))
    generic = sum(1 for t in tokens if t in _GENERIC)
    return {
        "char_len": len(text),
        "word_count": n,
        "unique_ratio": (uniq / n) if n else 0.0,
        "exclaim": text.count("!"),
        "caps_ratio": (sum(1 for c in text if c.isupper()) / max(len(text), 1)),
        "generic_ratio": (generic / n) if n else 0.0,
        "risk_hits": len(risk_keyword_hits(text)),
    }


def add_burst_scores(reviews: pd.DataFrame) -> pd.Series:
    """Burst score = how many reviews the same user posted on the same calendar
    day. Fake/paid reviewers tend to post many reviews in a single burst."""
    day = reviews["timestamp"].str.slice(0, 10)
    counts = reviews.groupby([reviews["user_id"], day]).transform("size")
    # ``transform('size')`` on a groupby of a single column returns a frame/series
    return pd.Series(np.asarray(counts).reshape(-1), index=reviews.index).astype(float)
