/** Typed client for the FastAPI backend (proxied at /api in dev). */

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// ---- types --------------------------------------------------------------- //
export interface Kpis {
  avg_trust: number;
  pred_return_rate: number;
  fraud_flagged: number;
  high_risk_products: number;
  fake_reviews: number;
  total_products: number;
  total_users: number;
  total_orders: number;
  total_reviews: number;
}

export interface Overview {
  kpis: Kpis;
  return_by_category: { category: string; rate: number }[];
  fraud_tiers: { tier: string; count: number }[];
  trust_hist: { bucket: string; count: number }[];
  returns_trend: { month: string; orders: number; returns: number; rate: number }[];
  top_risky_products: {
    id: number; name: string; category: string; risk_prob: number;
    trust: number; return_rate: number;
  }[];
  top_fraud_users: {
    id: number; name: string; fraud_prob: number; tier: string;
    return_rate: number; patterns: string[];
  }[];
  dataset: Record<string, number>;
}

export interface ProductListItem {
  id: number; name: string; category: string; price: number;
  seller_rating: number; image: string; trust: number; confidence: string;
  risk_prob: number; risk_tier: string; return_rate: number; n_reviews: number;
}

export interface ReviewItem {
  id: number; rating: number; text: string; verified_purchase: boolean;
  timestamp: string; p_fake: number;
}

export interface ProductDetail {
  product: {
    id: number; name: string; category: string; price: number;
    seller_id: number; seller_rating: number; image: string;
  };
  scores: {
    trust: number; trust_low: number; trust_high: number; confidence: string;
    naive_rating: number; bayesian_rating: number; n_reviews: number;
    risk_prob: number; risk_tier: string; return_rate: number;
    return_rate_bayes: number; neg_keyword_ratio: number;
    defect_reason_ratio: number; order_count: number;
  };
  order_count: number;
  reviews: ReviewItem[];
  risk_reasons: string[];
}

export interface UserListItem {
  id: number; name: string; account_age_days: number; total_orders: number;
  total_returns: number; fraud_prob: number; tier: string;
  return_rate: number; patterns: string[];
}

export interface UserDetail {
  user: {
    id: number; name: string; account_age_days: number; total_orders: number;
    total_returns: number; device_id: string; address_hash: string; coupon_uses: number;
  };
  scores: {
    fraud_prob: number; tier: string; iso_score: number;
    return_rate: number; return_rate_bayes: number; returns_within_3: number;
    shared_device_count: number; shared_address_count: number; review_burst: number;
    coupon_per_order: number; account_age_days: number; total_orders: number;
    patterns: { name: string; evidence: string }[];
  };
  orders: {
    id: number; product: string; price: number; payment_mode: string;
    discount_pct: number; returned: boolean; return_reason: string | null;
    days_to_return: number | null; timestamp: string;
  }[];
  linked_accounts: {
    id: number; name: string; shares_device: boolean;
    shares_address: boolean; fraud_prob: number;
  }[];
  timeline: { month: string; orders: number; returns: number }[];
}

export interface ReturnPrediction {
  probability: number; tier: string; action: string;
  factors: { factor: string; impact: number; direction: string }[];
  inputs: Record<string, number>;
}

export interface ReviewPrediction {
  probability: number; tier: string; confidence: string; reasons: string[];
  suspicious_words: string[]; risk_keywords: string[]; text_prob: number;
}

export interface Metric {
  model?: string; note?: string;
  accuracy: number; precision: number; recall: number; f1: number;
  roc_auc: number; brier: number;
  confusion_matrix: number[][];
  roc_curve: { fpr: number; tpr: number }[];
  calibration_curve: { pred: number; actual: number }[];
  support: number; positives: number;
}

export interface ModelMetrics {
  fake_review: { primary: Metric; baseline: Metric };
  return_risk: { logistic: Metric; gaussian_nb: Metric; baseline: Metric; best: string };
  fraud: { primary: Metric; baseline: Metric };
  product_risk: { primary: Metric; gaussian_nb: Metric; baseline: Metric };
  comparison: {
    one_order_one_return: {
      user_id: number; naive_return_rate: number; bayes_return_rate: number; explanation: string;
    } | null;
    trust_gap_example: {
      product_id: number; gap: number; naive_rating: number;
      bayesian_rating: number; confidence: string;
    } | null;
  };
  dataset: Record<string, number>;
}

export const api = {
  overview: () => get<Overview>("/overview"),
  products: (q: string) => get<{ total: number; items: ProductListItem[] }>(`/products${q}`),
  product: (id: number) => get<ProductDetail>(`/products/${id}`),
  users: (q: string) => get<{ total: number; items: UserListItem[] }>(`/users${q}`),
  user: (id: number) => get<UserDetail>(`/users/${id}`),
  predictReturn: (body: {
    category: string; price: number; discount_pct: number;
    payment_mode: string; delivery_days: number; user_id?: number;
  }) => post<ReturnPrediction>("/predict/return", body),
  predictReview: (body: { text: string; rating: number; verified_purchase: boolean }) =>
    post<ReviewPrediction>("/predict/review", body),
  metrics: () => get<ModelMetrics>("/models/metrics"),
};
