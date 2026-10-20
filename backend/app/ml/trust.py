"""Bayesian product trust score via a Beta-Binomial model.

Each review is treated as evidence of a "positive" (4-5 stars) or "negative"
(1-2 stars) experience. 3-star reviews are treated as half a positive. Every
review's weight is down-weighted by its probability of being fake, so a product
propped up by fake 5-star reviews does not earn unwarranted trust.

With a Beta(a0, b0) prior, the posterior after seeing ``pos`` positive and
``neg`` negative (fractional) counts is Beta(a0 + pos, b0 + neg). We report the
posterior mean (0-100), a 95% credible interval, and a confidence label derived
from the interval width.
"""
from __future__ import annotations

from dataclasses import dataclass

from scipy.stats import beta as beta_dist

PRIOR_A = 2.0
PRIOR_B = 2.0


@dataclass
class TrustResult:
    trust: float            # posterior mean * 100
    low: float              # 2.5% credible bound * 100
    high: float             # 97.5% credible bound * 100
    confidence: str         # Low / Medium / High
    naive_rating: float     # plain average star rating (1-5)
    bayesian_rating: float  # posterior mean mapped to 1-5 scale
    n_reviews: int
    pos: float
    neg: float


def _confidence(width: float) -> str:
    if width > 0.30:
        return "Low"
    if width > 0.15:
        return "Medium"
    return "High"


def compute_trust(ratings, fake_probs=None, avg_rating_fallback: float | None = None) -> TrustResult:
    """ratings: iterable of 1-5 ints. fake_probs: matching iterable of P(fake)."""
    ratings = list(ratings)
    n = len(ratings)
    if fake_probs is None:
        fake_probs = [0.0] * n
    fake_probs = list(fake_probs)

    pos = neg = 0.0
    rating_sum = 0.0
    wsum = 0.0
    for r, fp in zip(ratings, fake_probs):
        w = max(0.0, 1.0 - float(fp))
        rating_sum += r
        wsum += w
        if r >= 4:
            pos += w
        elif r <= 2:
            neg += w
        else:
            pos += 0.5 * w
            neg += 0.5 * w

    a = PRIOR_A + pos
    b = PRIOR_B + neg
    mean = a / (a + b)
    low = beta_dist.ppf(0.025, a, b)
    high = beta_dist.ppf(0.975, a, b)
    width = high - low

    naive = (rating_sum / n) if n else (avg_rating_fallback or 3.0)
    return TrustResult(
        trust=round(mean * 100, 1),
        low=round(low * 100, 1),
        high=round(high * 100, 1),
        confidence=_confidence(width),
        naive_rating=round(naive, 2),
        bayesian_rating=round(1 + mean * 4, 2),
        n_reviews=n,
        pos=round(pos, 2),
        neg=round(neg, 2),
    )
