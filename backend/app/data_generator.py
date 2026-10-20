"""Synthetic e-commerce data generator.

Everything is produced from a fixed seed so the demo is reproducible. Realistic
behavioural patterns are *injected* on purpose so the probabilistic models have
genuine signal to learn:

* Fashion / Footwear return more often; size complaints drive returns.
* COD + high discount increases returns.
* ~5% of users are fraudulent (wardrobing, shared device/address, review bursts,
  coupon abuse, very high return rates).
* ~8% of reviews are fake (short, generic, bursty, unverified, extreme rating).
* ~10% of products are genuinely risky (defect/complaint keywords, high returns).

The ground-truth flags are stored in the DB purely because the data is
synthetic; they become the labels used to train and evaluate the models.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

SEED = 42

N_PRODUCTS = 300
N_USERS = 2000
N_ORDERS = 15000
N_REVIEWS = 8000

FRAUD_USER_FRACTION = 0.05
FAKE_REVIEW_FRACTION = 0.08
RISKY_PRODUCT_FRACTION = 0.10

CATEGORIES = ["Fashion", "Footwear", "Electronics", "Home", "Beauty", "Toys"]

# Base return propensity per category and a typical price band.
CATEGORY_META = {
    "Fashion": {"base_return": 0.30, "price": (499, 4999), "sized": True},
    "Footwear": {"base_return": 0.32, "price": (899, 6999), "sized": True},
    "Electronics": {"base_return": 0.09, "price": (1499, 69999), "sized": False},
    "Home": {"base_return": 0.07, "price": (299, 9999), "sized": False},
    "Beauty": {"base_return": 0.11, "price": (199, 2999), "sized": False},
    "Toys": {"base_return": 0.08, "price": (199, 3999), "sized": False},
}

PRODUCT_WORDS = {
    "Fashion": ["Cotton", "Slim-Fit", "Denim", "Printed", "Linen", "Oversized",
                "Formal", "Casual", "Embroidered", "Striped"],
    "Footwear": ["Running", "Canvas", "Leather", "Sports", "Casual", "Formal",
                 "High-Top", "Trail", "Slip-On", "Chunky"],
    "Electronics": ["Wireless", "Smart", "4K", "Bluetooth", "Gaming", "Noise-Cancel",
                    "Fast-Charge", "Portable", "HD", "Pro"],
    "Home": ["Ceramic", "Non-Stick", "Memory-Foam", "Cordless", "Stainless",
             "Wooden", "Decor", "Storage", "Compact", "Premium"],
    "Beauty": ["Matte", "Hydrating", "Vitamin-C", "Organic", "SPF", "Herbal",
               "Long-Lasting", "Natural", "Glow", "Repair"],
    "Toys": ["Remote", "Building", "Educational", "Plush", "Wooden", "Puzzle",
             "Musical", "Action", "DIY", "Learning"],
}
PRODUCT_NOUNS = {
    "Fashion": ["Shirt", "T-Shirt", "Kurta", "Jeans", "Jacket", "Dress", "Trousers"],
    "Footwear": ["Sneakers", "Sandals", "Loafers", "Boots", "Heels", "Slippers"],
    "Electronics": ["Headphones", "Speaker", "Smartwatch", "Earbuds", "Monitor",
                    "Power Bank", "Keyboard"],
    "Home": ["Cookware Set", "Pillow", "Vacuum", "Bottle", "Lamp", "Organizer",
             "Bedsheet"],
    "Beauty": ["Serum", "Lipstick", "Sunscreen", "Face Wash", "Moisturizer",
               "Shampoo", "Cream"],
    "Toys": ["Car", "Blocks Set", "Doll", "Puzzle", "Robot", "Board Game"],
}

RISK_KEYWORDS = ["broke", "burnt", "leaking", "fake", "stopped working",
                 "defective", "cheap quality", "fell apart", "dangerous",
                 "overheated", "damaged", "not working"]

SIZE_REASONS = ["Size too small", "Size too large", "Wrong fit", "Not as per size chart"]
GENERIC_REASONS = ["Changed my mind", "Found cheaper elsewhere", "Late delivery",
                   "Different from picture", "Quality not good", "Damaged on arrival",
                   "Defective product"]

# Review text templates (templated so NLP features are meaningful).
POS_TEMPLATES = [
    "Absolutely love this {noun}. The quality is excellent and it fits perfectly.",
    "Great {noun}, exactly as described. Worth every rupee and delivery was fast.",
    "Very happy with this purchase. The {noun} feels premium and durable.",
    "Excellent product, comfortable and well made. Would recommend to friends.",
    "Good value for money. The material is nice and the colour is just like the photo.",
    "Impressed with the finish and build. Using it daily and no complaints at all.",
]
NEG_TEMPLATES = [
    "Very disappointed. The {noun} {kw} within a week, total waste of money.",
    "Poor quality, it {kw} after two uses. Looks {kw} and nothing like the photos.",
    "Do not buy. The product {kw} and the seller refused a replacement.",
    "Terrible experience, item arrived {kw} and {kw} on first use.",
    "The {noun} is clearly {kw}, it {kw} almost immediately. Returning it.",
]
NEUTRAL_TEMPLATES = [
    "The {noun} is okay for the price, nothing special but does the job.",
    "Average product. Delivery was fine, quality is decent but not great.",
    "It works as expected. Packaging could be better but overall acceptable.",
    "Decent {noun}, some minor issues with finish but usable for daily needs.",
]
FAKE_TEMPLATES = [
    "Nice product", "Very good", "Awesome!!!", "Best ever", "Super", "Worst",
    "Loved it", "Amazing product good", "Nice nice nice", "Good quality nice",
    "Excellent must buy", "Too good", "Great value super product", "Fantastic buy now",
]

FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh",
               "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Saanvi", "Aadhya",
               "Pari", "Anika", "Navya", "Myra", "Sara", "Kiara", "Rahul", "Priya",
               "Neha", "Rohan", "Sneha", "Karthik", "Divya", "Manish", "Pooja", "Amit"]
LAST_NAMES = ["Sharma", "Verma", "Reddy", "Nair", "Iyer", "Patel", "Gupta", "Rao",
              "Mehta", "Das", "Khan", "Singh", "Joshi", "Kumar", "Pillai", "Bose"]

START_DATE = datetime(2024, 1, 1)
DAY_SPAN = 540  # ~18 months of activity


def _hash(s: str) -> str:
    return hashlib.sha1(s.encode()).hexdigest()[:10]


def _ts(rng, day_offset=None):
    if day_offset is None:
        day_offset = int(rng.integers(0, DAY_SPAN))
    dt = START_DATE + timedelta(days=int(day_offset),
                                hours=int(rng.integers(0, 24)),
                                minutes=int(rng.integers(0, 60)))
    return dt.strftime("%Y-%m-%d %H:%M:%S"), day_offset


def generate() -> dict[str, pd.DataFrame]:
    rng = np.random.default_rng(SEED)

    # ---------------------------------------------------------------- products
    n_sellers = 45
    seller_rating = {s: round(float(rng.uniform(2.6, 5.0)), 2) for s in range(1, n_sellers + 1)}

    products = []
    risky_ids = set(rng.choice(np.arange(1, N_PRODUCTS + 1),
                               size=int(N_PRODUCTS * RISKY_PRODUCT_FRACTION),
                               replace=False).tolist())
    # Latent "defect propensity" per product. The is_risky LABEL is a noisy
    # threshold on this latent, so some risky products behave acceptably and
    # some ordinary products look shaky — the risk model must infer it from
    # evidence rather than reading the label straight off the signal.
    prod_neg: dict[int, float] = {}
    for pid in range(1, N_PRODUCTS + 1):
        cat = CATEGORIES[rng.integers(0, len(CATEGORIES))]
        meta = CATEGORY_META[cat]
        lo, hi = meta["price"]
        price = round(float(rng.uniform(lo, hi)), 0)
        name = f"{rng.choice(PRODUCT_WORDS[cat])} {rng.choice(PRODUCT_NOUNS[cat])}"
        seller = int(rng.integers(1, n_sellers + 1))
        is_risky = pid in risky_ids
        neg = 0.12 + (0.45 if is_risky else 0.0) + float(rng.normal(0, 0.14))
        prod_neg[pid] = float(np.clip(neg, 0.03, 0.92))
        # weaker products tend to have weaker sellers
        srating = seller_rating[seller]
        if prod_neg[pid] > 0.4:
            srating = round(max(2.3, srating - rng.uniform(0.2, 1.1)), 2)
        products.append(dict(id=pid, name=name, category=cat, price=price,
                             seller_id=seller, seller_rating=srating,
                             image=f"ph:{cat.lower()}-{pid}", is_risky=is_risky))
    products_df = pd.DataFrame(products).set_index("id", drop=False)

    # ------------------------------------------------------------------- users
    # Fraud is deliberately NOT perfectly separable: ~60% of fraudsters are
    # "hard" (organised rings, fast wardrobing, heavy coupon abuse) and ~40% are
    # "soft" (only one or two weak signals). We also add legitimate households
    # that genuinely share a device/address, so "multi-account" alone must not
    # imply fraud — forcing the model to weigh evidence probabilistically.
    n_fraud = int(N_USERS * FRAUD_USER_FRACTION)
    fraud_ids = set(rng.choice(np.arange(1, N_USERS + 1), size=n_fraud,
                               replace=False).tolist())
    fraud_list = sorted(fraud_ids)
    rng.shuffle(fraud_list)
    n_hard = int(len(fraud_list) * 0.6)
    hard_fraud = set(fraud_list[:n_hard])
    soft_fraud = set(fraud_list[n_hard:])

    device_map: dict[int, str] = {}
    addr_map: dict[int, str] = {}

    # hard fraud rings share device + address across 2-5 accounts
    hard_list = sorted(hard_fraud)
    i = ring_no = 0
    while i < len(hard_list):
        size = int(rng.integers(2, 6))
        members = hard_list[i:i + size]
        dev, ad = f"DEV-RING-{ring_no}", _hash(f"ring-addr-{ring_no}")
        for m in members:
            device_map[m], addr_map[m] = dev, ad
        ring_no += 1
        i += size

    # soft fraud: ~40% lightly share with one partner, rest look unique
    soft_list = sorted(soft_fraud)
    j = 0
    while j < len(soft_list):
        if rng.random() < 0.4 and j + 1 < len(soft_list):
            dev, ad = f"DEV-SOFT-{j}", _hash(f"soft-addr-{j}")
            device_map[soft_list[j]] = device_map[soft_list[j + 1]] = dev
            addr_map[soft_list[j]] = addr_map[soft_list[j + 1]] = ad
            j += 2
        else:
            j += 1

    # legitimate households (non-fraud users that share a device/address)
    non_fraud = [u for u in range(1, N_USERS + 1) if u not in fraud_ids]
    household_members = set(rng.choice(non_fraud, size=40, replace=False).tolist())
    hh = sorted(household_members)
    k = hh_no = 0
    while k < len(hh):
        size = int(rng.integers(2, 4))
        for m in hh[k:k + size]:
            device_map[m] = f"DEV-HOME-{hh_no}"
            addr_map[m] = _hash(f"home-addr-{hh_no}")
        hh_no += 1
        k += size

    # per-user generative knobs used when sampling orders/reviews
    return_boost: dict[int, float] = {}
    fast_return: dict[int, bool] = {}

    users = []
    for uid in range(1, N_USERS + 1):
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        is_fraud = uid in fraud_ids
        device = device_map.get(uid, f"DEV-{uid}-{rng.integers(0, 9999)}")
        addr = addr_map.get(uid, _hash(f"user-addr-{uid}"))
        if uid in hard_fraud:
            account_age = int(rng.integers(5, 220))
            coupon_uses = int(rng.integers(10, 40))
            return_boost[uid] = float(rng.uniform(0.40, 0.60))
            fast_return[uid] = True
        elif uid in soft_fraud:
            account_age = int(rng.integers(10, 400))
            coupon_uses = int(rng.integers(3, 14))
            return_boost[uid] = float(rng.uniform(0.15, 0.32))
            fast_return[uid] = rng.random() < 0.4
        else:
            account_age = int(rng.integers(20, 1400))
            coupon_uses = int(rng.integers(0, 6))
            # a few honest but returny shoppers add overlap/noise
            return_boost[uid] = float(rng.uniform(0.0, 0.18)) if rng.random() < 0.12 else 0.0
            fast_return[uid] = False
        users.append(dict(id=uid, name=name, account_age_days=account_age,
                          total_orders=0, total_returns=0, device_id=device,
                          address_hash=addr, coupon_uses=coupon_uses,
                          is_fraud=is_fraud))
    users_df = pd.DataFrame(users).set_index("id", drop=False)

    # Fraud users shop more; soft fraud a bit less than hard fraud
    weights = []
    for uid in users_df["id"]:
        if uid in hard_fraud:
            weights.append(4.5)
        elif uid in soft_fraud:
            weights.append(2.5)
        else:
            weights.append(1.0)
    order_weights = np.asarray(weights, dtype=float)
    order_weights = order_weights / order_weights.sum()

    # ------------------------------------------------------------------ orders
    orders = []
    user_order_count = {uid: 0 for uid in users_df["id"]}
    user_return_count = {uid: 0 for uid in users_df["id"]}
    prod_order_count = {pid: 0 for pid in products_df["id"]}
    prod_return_count = {pid: 0 for pid in products_df["id"]}

    uid_choices = users_df["id"].to_numpy()
    pid_choices = products_df["id"].to_numpy()

    for oid in range(1, N_ORDERS + 1):
        uid = int(rng.choice(uid_choices, p=order_weights))
        pid = int(rng.choice(pid_choices))
        prod = products_df.loc[pid]
        is_fraud_user = bool(users_df.loc[uid, "is_fraud"])
        cat = prod["category"]
        meta = CATEGORY_META[cat]

        boost = return_boost[uid]
        discount = float(np.clip(rng.beta(2, 5) * 80, 0, 80))
        cod_prop = 0.4 + 0.25 * min(boost / 0.5, 1.0)
        payment = "COD" if rng.random() < cod_prop else "Prepaid"
        delivery = int(np.clip(rng.poisson(4) + 1, 1, 15))
        size = None
        if meta["sized"]:
            size = str(rng.choice(["S", "M", "L", "XL", "6", "7", "8", "9", "10"]))
        price = round(float(prod["price"]) * float(rng.uniform(0.9, 1.05)), 0)

        # --- return probability model (ground truth generative process) ------
        p = meta["base_return"]
        if payment == "COD":
            p += 0.08
        p += (discount / 100.0) * 0.18          # high discount -> more returns
        if delivery > 7:
            p += 0.06
        if meta["sized"]:
            p += 0.07                            # sizing friction
        p += 0.22 * prod_neg[pid]               # weak products are returned more
        p += boost                              # wardrobing / abuse propensity
        p += float(rng.normal(0, 0.05))         # irreducible noise
        p = float(np.clip(p, 0.01, 0.97))
        returned = rng.random() < p

        ts, day = _ts(rng)
        reason = None
        days_to_return = None
        if returned:
            if meta["sized"] and rng.random() < 0.6:
                reason = str(rng.choice(SIZE_REASONS))
            else:
                reason = str(rng.choice(GENERIC_REASONS))
            # wardrobers return very fast; everyone else over a normal window
            days_to_return = (int(rng.integers(1, 3)) if fast_return[uid]
                              else int(rng.integers(2, 20)))

        orders.append(dict(id=oid, user_id=uid, product_id=pid, price=price,
                           discount_pct=round(discount, 1), payment_mode=payment,
                           delivery_days=delivery, size_chosen=size,
                           returned=bool(returned), return_reason=reason,
                           days_to_return=days_to_return, timestamp=ts))
        user_order_count[uid] += 1
        prod_order_count[pid] += 1
        if returned:
            user_return_count[uid] += 1
            prod_return_count[pid] += 1

    orders_df = pd.DataFrame(orders)

    users_df["total_orders"] = users_df["id"].map(user_order_count)
    users_df["total_returns"] = users_df["id"].map(user_return_count)

    # ----------------------------------------------------------------- reviews
    reviews = []
    n_fake = int(N_REVIEWS * FAKE_REVIEW_FRACTION)
    fake_idx = set(rng.choice(np.arange(N_REVIEWS), size=n_fake, replace=False).tolist())

    # pre-pick burst days per fake reviewer cluster to create review bursts
    for rid in range(N_REVIEWS):
        uid = int(rng.choice(uid_choices, p=order_weights))
        pid = int(rng.choice(pid_choices))
        prod = products_df.loc[pid]
        is_fake = rid in fake_idx or bool(users_df.loc[uid, "is_fraud"] and rng.random() < 0.35)

        noun = prod["name"].split()[-1].lower()
        if is_fake:
            if rng.random() < 0.25:
                # "camouflaged" fake: reads like a real positive review -> overlap
                rating = int(rng.choice([4, 5], p=[0.3, 0.7]))
                text = str(rng.choice(POS_TEMPLATES)).format(noun=noun)
                verified = rng.random() < 0.35
                ts, _ = _ts(rng)
            else:
                rating = int(rng.choice([1, 5], p=[0.2, 0.8]))  # extreme
                text = str(rng.choice(FAKE_TEMPLATES))
                verified = rng.random() < 0.1
                # bursty timing: cluster near a few specific days
                burst_day = int(rng.choice([30, 90, 150, 210, 300, 400]))
                ts, _ = _ts(rng, day_offset=burst_day)
        else:
            # genuine rating reflects the product's latent quality (not its label)
            if prod_neg[pid] > 0.4:
                rating = int(rng.choice([1, 2, 3, 4, 5], p=[0.32, 0.26, 0.2, 0.14, 0.08]))
            else:
                rating = int(rng.choice([1, 2, 3, 4, 5], p=[0.05, 0.08, 0.17, 0.33, 0.37]))
            if rng.random() < 0.12:
                # genuine but terse/unverified -> looks superficially fake (overlap)
                text = str(rng.choice(FAKE_TEMPLATES))
                verified = rng.random() < 0.5
            elif rating <= 2:
                kw = str(rng.choice(RISK_KEYWORDS))
                kw2 = str(rng.choice(RISK_KEYWORDS))
                text = str(rng.choice(NEG_TEMPLATES)).format(noun=noun, kw=kw).replace(
                    "{kw}", kw2)
                if kw2 not in text:
                    text = text + f" It {kw2}."
                verified = rng.random() < 0.82
            elif rating == 3:
                text = str(rng.choice(NEUTRAL_TEMPLATES)).format(noun=noun)
                verified = rng.random() < 0.82
            else:
                text = str(rng.choice(POS_TEMPLATES)).format(noun=noun)
                verified = rng.random() < 0.82
            ts, _ = _ts(rng)

        reviews.append(dict(id=rid + 1, user_id=uid, product_id=pid, rating=rating,
                           text=text, timestamp=ts, verified_purchase=bool(verified),
                           is_fake=bool(is_fake)))

    reviews_df = pd.DataFrame(reviews)

    return {
        "products": products_df.reset_index(drop=True),
        "users": users_df.reset_index(drop=True),
        "orders": orders_df,
        "reviews": reviews_df,
    }
