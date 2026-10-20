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
      return { text: "text-risk-high", bg: "bg-risk-high/15", ring: "ring-risk-high/40", hex: "#FB7185" };
    case "Medium":
      return { text: "text-risk-med", bg: "bg-risk-med/15", ring: "ring-risk-med/40", hex: "#FBBF24" };
    default:
      return { text: "text-risk-low", bg: "bg-risk-low/15", ring: "ring-risk-low/40", hex: "#34D399" };
  }
}

/** map a 0-100 trust score to a colour. */
export function trustHex(v: number) {
  if (v >= 70) return "#34D399";
  if (v >= 45) return "#FBBF24";
  return "#FB7185";
}

export function confidenceTone(c: string) {
  if (c === "High") return "text-risk-low";
  if (c === "Medium") return "text-risk-med";
  return "text-slate-400";
}
