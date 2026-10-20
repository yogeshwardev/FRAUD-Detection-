# TrustLens — Intelligent Consumer Trust & Product Risk Assessment

### *Using Probabilistic Machine Learning*

A full-stack analytics platform that scores **product trust**, **return risk**, **fraud users**
and **fake reviews** — where every prediction ships with a **probability** and an **uncertainty
estimate**, not a bare label. Built as a final-year project and designed to be demoed live.

> **Tagline:** *Predict trust, returns and fraud — with confidence, not guesses.*

---

## ✨ Highlights

- **5 probabilistic ML modules** trained on realistic synthetic e-commerce data.
- Every score is **calibrated** (`CalibratedClassifierCV`) and comes with a **confidence level**.
- **Bayesian trust** (Beta-Binomial) with a 95% credible interval, down-weighting likely-fake reviews.
- **Premium SaaS UI** — dark glassmorphism, animated gauges, Recharts, Framer Motion, ⌘K command palette.
- **One-command run** (`start.bat` / `start.sh`): installs, generates data, trains, launches both servers.
- Honest evaluation: each model is compared against a **non-probabilistic baseline**.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A[Synthetic Data Generator<br/>300 products · 2k users<br/>15k orders · 8k reviews] --> B[(SQLite<br/>via SQLAlchemy)]
    B --> C[Feature Engineering<br/>TF-IDF · behavioural<br/>Bayesian-smoothed rates]
    C --> D{Probabilistic Models}
    D --> D1[ComplementNB + Calibrated LR<br/>Fake Review]
    D --> D2[Beta-Binomial<br/>Trust Score]
    D --> D3[Calibrated LR / GaussianNB<br/>Return Risk]
    D --> D4[Isolation Forest + Calibrated LR<br/>Fraud User]
    D --> D5[Calibrated LR<br/>Product Risk]
    D1 & D2 & D3 & D4 & D5 --> E[Precomputed Scores<br/>+ Confidence]
    E --> F[FastAPI REST API]
    F --> G[React + Vite + Tailwind<br/>Dashboard]
```

**Stack**

| Layer    | Technology |
|----------|-----------|
| Backend  | Python 3.11, FastAPI, scikit-learn, scipy, numpy, pandas, joblib |
| Storage  | SQLite via SQLAlchemy |
| Frontend | React + Vite + TypeScript, Tailwind CSS, Recharts, Framer Motion, lucide-react |

---

## 🚀 Quick start (one command)

**Windows**

```bat
start.bat
```

**macOS / Linux / Git-Bash**

```bash
./start.sh
```

The script will:
1. create a Python virtual environment and install backend dependencies,
2. generate the synthetic dataset and train all models (first run only, ~40s),
3. install frontend dependencies,
4. launch the API on **http://127.0.0.1:8000** and the web app on **http://localhost:5173**.

Open **http://localhost:5173** in your browser.

### Manual run

```bash
# backend
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# .venv/bin/python -m pip install -r requirements.txt      # macOS/Linux
.venv/Scripts/python -m uvicorn app.main:app --port 8000

# frontend (second terminal)
cd frontend
npm install
npm run dev
```

> Interactive API docs are available at **http://127.0.0.1:8000/docs**.
> To force a clean rebuild of data + models, delete `backend/data/` and `backend/artifacts/`.

---

## 🧠 ML Modules

| # | Module | Approach | Output |
|---|--------|----------|--------|
| A | **Fake Review Detection** | ComplementNB on TF-IDF text (out-of-fold) stacked with a calibrated Logistic Regression over behavioural features (burst score, rating deviation, verified flag, length, generic-word ratio). | `P(fake)` + reasons + highlighted words |
| B | **Product Trust (Bayesian)** | Beta-Binomial with a `Beta(2,2)` prior; each review weighted by `1 − P(fake)`. | Trust 0–100, 95% credible interval, confidence, naïve vs Bayesian rating |
| C | **Return Risk** | Calibrated Logistic Regression **vs** Gaussian Naïve Bayes (best by ROC-AUC); features include Bayesian-smoothed user & product return rates, discount, COD, delivery time, size-complaint ratio. | `P(return)` + log-odds factor contributions + action |
| D | **Fraud User Detection** | Isolation Forest anomaly score **fused** into a calibrated Logistic Regression over Bayesian-smoothed return rate, 3-day returns, shared device/address counts, review burst, coupon-per-order. | `P(fraud)`, tier, triggered patterns with evidence |
| E | **Product Risk** | Calibrated classifier over negative-keyword ratio, return rate, defect-reason ratio, seller rating, trust. | `P(high risk)` + reasons |
| F | **Evaluation** | Accuracy, precision, recall, F1, ROC-AUC, confusion matrix, ROC & calibration curves, Brier score — vs a non-probabilistic baseline (plain SVM / naïve rule). | Served at `/api/models/metrics` |

### Representative held-out metrics (seed = 42)

| Module | Model | ROC-AUC | F1 | Brier | Baseline F1 |
|--------|-------|:------:|:--:|:-----:|:-----------:|
| Fake Review | ComplementNB + Calibrated LR | 0.91 | 0.64 | 0.065 | 0.54 (SVM) |
| Return Risk | Calibrated Logistic | 0.81 | 0.65 | 0.170 | 0.62 (SVM) |
| Fraud User | Isolation Forest + Calibrated LR | ~1.0 | 0.96 | 0.003 | 0.65 (naïve rule) |
| Product Risk | Calibrated Logistic | ~1.0 | 0.92 | 0.020 | 0.88 (SVM) |

The probabilistic models beat their baselines most clearly on **precision** and **Brier score**
(calibration) — exactly where it matters when a number triggers a real action.

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/overview` | KPIs, risk distributions, trend, top risky products / fraud users |
| GET | `/api/products?search=&category=&sort=` | Product list with trust & risk scores |
| GET | `/api/products/{id}` | Trust + interval, risk, reviews with `P(fake)`, explanations |
| GET | `/api/users?tier=&search=&sort=` | User list with fraud probability |
| GET | `/api/users/{id}` | Fraud probability, patterns, order history, linked accounts |
| POST | `/api/predict/return` | Body → `P(return)`, factors, recommended action |
| POST | `/api/predict/review` | Review text + meta → `P(fake)`, explanation |
| GET | `/api/models/metrics` | All evaluation metrics and curve data |

---

## 🖥️ Pages

1. **Landing** — hero, feature cards, editable student/guide/college credits.
2. **Overview** — 5 KPIs, return-by-category, fraud-tier donut, trust histogram, returns trend, top-10 tables.
3. **Trust & Risk Explorer** — searchable product grid → detail with animated trust gauge + credible band, naïve-vs-Bayesian, reviews with fake badges, "why this score?".
4. **Return Risk Predictor** *(live demo)* — form with sliders, try-example buttons, animated probability gauge, factor bars, action card.
5. **Fraud User Detection** — tiered user list → detail with fraud gauge, pattern chips, timeline, linked-account network graph.
6. **Fake Review Checker** — paste text → `P(fake)` with highlighted suspicious words.
7. **Model Performance** — per-model metrics, ROC curves, confusion heatmaps, calibration curves, probabilistic-vs-traditional section.
8. **How It Works** — pipeline diagram and plain-English explanations.

---

## 📸 Screenshots

> Add screenshots here after running the app (e.g. `docs/overview.png`, `docs/predictor.png`).

| Dashboard | Return Predictor | Model Performance |
|-----------|------------------|-------------------|
| _add image_ | _add image_ | _add image_ |

---

## 🎓 Viva Q&A

**Q: Why probabilistic ML instead of plain classification?**
A real decision ("block this user", "require prepaid") needs to weigh *how sure* we are. A point
label discards that. Calibrated probabilities let us set thresholds, rank by risk, and show
uncertainty — so a 95% case and a 51% case are treated differently.

**Q: Why a Beta prior for trust?**
The Beta distribution is the conjugate prior of the Binomial, so updating with positive/negative
reviews is analytic and cheap. A `Beta(2,2)` prior encodes "assume roughly average until proven
otherwise", which shrinks sparse products toward neutral and yields a credible interval for free.

**Q: How is fraud different from just a high return rate?**
A high return *ratio* can come from a genuine shopper with one unlucky order. Fraud is a **pattern**:
fast wardrobing returns, shared devices/addresses across accounts, review bursts, coupon abuse — on
top of a **Bayesian-smoothed** return rate so low-evidence users aren't punished. We demonstrate this
with the "1 order, 1 return" case: naïve rate = 100%, smoothed rate ≈ population average → not flagged.

**Q: What data did you use and why synthetic?**
Real platforms never release labelled fraud / fake-review / return-outcome data (privacy + liability).
We generate a reproducible, seeded world (300 products, 2k users, 15k orders, 8k reviews) where
ground-truth labels are known and realistic patterns are injected, with deliberate overlap so the
models can't trivially read the label off a giveaway feature.

**Q: How do you know the probabilities are trustworthy?**
We calibrate every classifier with `CalibratedClassifierCV` and report the **Brier score** and a
**calibration curve** — a model whose "70%" really happens ~70% of the time hugs the diagonal.

**Q: Limitations and future scope?**
Synthetic data can't capture every real-world nuance; text features are template-driven. Future work:
real transformer embeddings for reviews, graph neural networks for fraud rings, online/streaming
updates of the Bayesian posteriors, and human-in-the-loop label feedback.

---

## 📁 Project structure

```
jyoshna/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + endpoints
│   │   ├── database.py        # SQLAlchemy models
│   │   ├── data_generator.py  # seeded synthetic data
│   │   ├── bootstrap.py       # generate → persist → train
│   │   ├── schemas.py         # Pydantic request bodies
│   │   └── ml/
│   │       ├── pipeline.py    # trains all models, metrics, scores
│   │       ├── inference.py   # runtime predictions
│   │       ├── fake_review.py # ComplementNB + calibrated LR
│   │       ├── trust.py       # Beta-Binomial
│   │       ├── metrics.py     # evaluation helpers
│   │       └── text_features.py
│   └── requirements.txt
├── frontend/                  # React + Vite + TS + Tailwind
│   └── src/{pages,components,lib}
├── start.bat / start.sh
└── README.md
```

---

*Built with probabilistic ML — trust, returns and fraud, with confidence.*
