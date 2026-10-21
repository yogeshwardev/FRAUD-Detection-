"""Snapshot the open DummyJSON product catalogue (MIT-licensed demo data).

Writes ``backend/app/catalog.json`` (titles, brands, descriptions, prices,
categories) and downloads every product photo into
``frontend/public/catalog/<id>/`` so the storefront works offline with real,
matching product imagery.

Run once:  python scripts/fetch_catalog.py
"""
from __future__ import annotations

import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_JSON = ROOT / "backend" / "app" / "catalog.json"
IMAGE_DIR = ROOT / "frontend" / "public" / "catalog"
SOURCE = "https://dummyjson.com/products?limit=0"
UA = {"User-Agent": "Mozilla/5.0 (TrustLens catalogue snapshot)"}

# DummyJSON category -> (store category, review noun, sized?)
CATEGORY_MAP = {
    "mens-shirts": ("Fashion", "shirt", True),
    "tops": ("Fashion", "top", True),
    "womens-dresses": ("Fashion", "dress", True),
    "womens-bags": ("Fashion", "bag", False),
    "womens-jewellery": ("Fashion", "jewellery", False),
    "sunglasses": ("Fashion", "sunglasses", False),
    "mens-shoes": ("Footwear", "shoes", True),
    "womens-shoes": ("Footwear", "shoes", True),
    "smartphones": ("Electronics", "phone", False),
    "laptops": ("Electronics", "laptop", False),
    "tablets": ("Electronics", "tablet", False),
    "mobile-accessories": ("Electronics", "accessory", False),
    "mens-watches": ("Electronics", "watch", False),
    "womens-watches": ("Electronics", "watch", False),
    "furniture": ("Home", "furniture", False),
    "home-decoration": ("Home", "decor piece", False),
    "kitchen-accessories": ("Home", "kitchen tool", False),
    "beauty": ("Beauty", "product", False),
    "fragrances": ("Beauty", "fragrance", False),
    "skin-care": ("Beauty", "cream", False),
    "sports-accessories": ("Sports", "gear", False),
}


def _get(url: str, attempts: int = 4) -> bytes:
    for i in range(attempts):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        except Exception:
            if i == attempts - 1:
                raise
            time.sleep(1.5 * (i + 1))
    raise RuntimeError("unreachable")


def _download(job: tuple[str, Path]) -> None:
    url, dest = job
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(_get(url))


def main() -> None:
    data = json.loads(_get(SOURCE))
    products, jobs = [], []
    for p in data["products"]:
        if p["category"] not in CATEGORY_MAP:
            continue
        store_cat, noun, sized = CATEGORY_MAP[p["category"]]
        pid = p["id"]
        ext = Path(p["thumbnail"]).suffix or ".webp"
        thumb = f"/catalog/{pid}/thumb{ext}"
        jobs.append((p["thumbnail"], IMAGE_DIR / str(pid) / f"thumb{ext}"))
        gallery = []
        for i, url in enumerate(p["images"], start=1):
            e = Path(url).suffix or ".webp"
            gallery.append(f"/catalog/{pid}/{i}{e}")
            jobs.append((url, IMAGE_DIR / str(pid) / f"{i}{e}"))
        products.append({
            "source_id": pid,
            "title": p["title"],
            "brand": p.get("brand") or "Generic",
            "description": p["description"],
            "source_category": p["category"],
            "category": store_cat,
            "noun": noun,
            "sized": sized,
            "price_usd": p["price"],
            "tags": p.get("tags", []),
            "thumbnail": thumb,
            "gallery": gallery,
        })

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(_download, jobs))

    CATALOG_JSON.write_text(json.dumps(products, indent=1), encoding="utf-8")
    print(f"Saved {len(products)} products and {len(jobs)} images.")


if __name__ == "__main__":
    main()
