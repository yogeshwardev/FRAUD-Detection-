"""Pydantic request/response schemas for the prediction endpoints."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ReturnPredictRequest(BaseModel):
    category: str = Field(..., examples=["Fashion"])
    price: float = Field(..., ge=0)
    discount_pct: float = Field(..., ge=0, le=100)
    payment_mode: str = Field(..., examples=["COD", "Prepaid"])
    delivery_days: int = Field(..., ge=1, le=30)
    user_id: Optional[int] = None


class ReviewPredictRequest(BaseModel):
    text: str
    rating: int = Field(5, ge=1, le=5)
    verified_purchase: bool = True
