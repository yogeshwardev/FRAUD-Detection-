"""Startup orchestration: generate data, persist to SQLite, train models.

Both steps are idempotent — if the DB and trained artifacts already exist the
server starts instantly. Delete ``backend/data`` and ``backend/artifacts`` to
force a clean rebuild.
"""
from __future__ import annotations

import json

import pandas as pd

from . import database as db
from .data_generator import generate
from .ml import inference
from .ml.pipeline import train_all


def _records(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to records with native Python types (no numpy)."""
    return json.loads(df.to_json(orient="records"))


def _persist(data: dict[str, pd.DataFrame]) -> None:
    db.reset_database()
    session = db.SessionLocal()
    try:
        session.bulk_insert_mappings(db.Product, _records(data["products"]))
        session.bulk_insert_mappings(db.User, _records(data["users"]))
        session.bulk_insert_mappings(db.Order, _records(data["orders"]))
        session.bulk_insert_mappings(db.Review, _records(data["reviews"]))
        session.commit()
    finally:
        session.close()


_BOOL_COLUMNS = {
    "products": ["is_risky"],
    "users": ["is_fraud"],
    "orders": ["returned"],
    "reviews": ["verified_purchase", "is_fake"],
}


def _load_from_db() -> dict[str, pd.DataFrame]:
    data = {t: pd.read_sql(f"SELECT * FROM {t}", db.engine) for t in _BOOL_COLUMNS}
    # SQLite stores booleans as 0/1; restore real bools so boolean masks work
    for table, cols in _BOOL_COLUMNS.items():
        for c in cols:
            data[table][c] = data[table][c].astype(bool)
    return data


def ensure_ready(verbose: bool = True) -> None:
    data = None
    if not db.db_exists():
        if verbose:
            print("[bootstrap] Generating synthetic dataset ...")
        data = generate()
        if verbose:
            print("[bootstrap] Persisting to SQLite ...")
        _persist(data)
    else:
        if verbose:
            print("[bootstrap] Database found — skipping generation.")

    if not inference.artifacts_exist():
        if data is None:
            if verbose:
                print("[bootstrap] Loading dataset from database ...")
            data = _load_from_db()
        if verbose:
            print("[bootstrap] Training probabilistic models (first run only) ...")
        train_all(data)
        if verbose:
            print("[bootstrap] Training complete.")
    else:
        if verbose:
            print("[bootstrap] Trained models found — skipping training.")

    inference.load()
    if verbose:
        print("[bootstrap] Ready.")


if __name__ == "__main__":
    ensure_ready()
