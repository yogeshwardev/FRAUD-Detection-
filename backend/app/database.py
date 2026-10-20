"""SQLAlchemy models and session management for the e-commerce dataset.

The database stores the synthetic ground-truth world (products, users, orders,
reviews). Ground-truth label columns (``is_fraud``, ``is_fake``, ``is_risky``)
exist only because the data is synthetic — they are what the probabilistic
models are trained against and evaluated on.
"""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACT_DIR = BASE_DIR / "artifacts"
DATA_DIR.mkdir(exist_ok=True)
ARTIFACT_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "store.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}, future=True
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    seller_id = Column(Integer, index=True, nullable=False)
    seller_rating = Column(Float, nullable=False)
    image = Column(String, nullable=False)
    is_risky = Column(Boolean, default=False)  # ground truth

    reviews = relationship("Review", back_populates="product")
    orders = relationship("Order", back_populates="product")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    account_age_days = Column(Integer, nullable=False)
    total_orders = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    device_id = Column(String, index=True, nullable=False)
    address_hash = Column(String, index=True, nullable=False)
    coupon_uses = Column(Integer, default=0)
    is_fraud = Column(Boolean, default=False)  # ground truth

    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    price = Column(Float, nullable=False)
    discount_pct = Column(Float, nullable=False)
    payment_mode = Column(String, nullable=False)  # COD / Prepaid
    delivery_days = Column(Integer, nullable=False)
    size_chosen = Column(String, nullable=True)
    returned = Column(Boolean, default=False)
    return_reason = Column(String, nullable=True)
    days_to_return = Column(Integer, nullable=True)
    timestamp = Column(String, nullable=False)

    user = relationship("User", back_populates="orders")
    product = relationship("Product", back_populates="orders")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
    verified_purchase = Column(Boolean, default=True)
    is_fake = Column(Boolean, default=False)  # ground truth

    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def db_exists() -> bool:
    return DB_PATH.exists() and DB_PATH.stat().st_size > 0


def reset_database() -> None:
    if DB_PATH.exists():
        os.remove(DB_PATH)
    Base.metadata.create_all(engine)
