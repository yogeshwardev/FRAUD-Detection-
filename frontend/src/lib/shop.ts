/** Storefront helpers: derive a star rating and retail pricing from the data. */

export function starRating(trust: number) {
  // map the 0-100 Bayesian trust score onto a 5-star retail rating (min 3.1)
  return Math.max(3.1, Math.min(5, Math.round((trust / 20) * 10) / 10));
}

export function pricing(price: number, id: number) {
  const discount = 15 + ((id * 7) % 46); // 15–60%
  const mrp = Math.round(price / (1 - discount / 100) / 10) * 10;
  return { mrp, discount };
}

export const CATEGORIES = ["Fashion", "Footwear", "Electronics", "Home", "Beauty", "Sports"];
