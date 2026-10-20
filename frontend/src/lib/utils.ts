import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtNum(n: number, digits = 0) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtInr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function pct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`;
}

export type Tier = "Low" | "Medium" | "High";

/** colour tokens per risk tier (text / bg / ring / hex). */
export function tier(t: string) {
  switch (t) {
    case "High":
      return { text: "text-risk-high", bg: "bg-risk-high/10", ring: "ring-risk-high/30", hex: "#dc2626" };
    case "Medium":
      return { text: "text-risk-med", bg: "bg-risk-med/10", ring: "ring-risk-med/30", hex: "#d97706" };
    default:
      return { text: "text-risk-low", bg: "bg-risk-low/10", ring: "ring-risk-low/30", hex: "#16a34a" };
  }
}

/** map a 0-100 trust score to a colour. */
export function trustHex(v: number) {
  if (v >= 70) return "#16a34a";
  if (v >= 45) return "#d97706";
  return "#dc2626";
}

export function confidenceTone(c: string) {
  if (c === "High") return "text-risk-low";
  if (c === "Medium") return "text-risk-med";
  return "text-slate-400";
}
