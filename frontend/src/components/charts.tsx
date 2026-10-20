import type { TooltipProps } from "recharts";

export const CHART = {
  violet: "#4f46e5", // indigo-600 (primary)
  cyan: "#2563eb", // blue-600 (secondary)
  low: "#16a34a",
  med: "#d97706",
  high: "#dc2626",
  grid: "rgba(148,163,184,0.22)",
  axis: "#64748b", // slate-500 — legible on both light and dark backgrounds
};

export const TIER_COLORS: Record<string, string> = {
  Low: CHART.low,
  Medium: CHART.med,
  High: CHART.high,
};

export function ChartTooltip({ active, payload, label, unit = "" }: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs shadow-glass">
      {label !== undefined && <p className="mb-1 font-medium text-slate-700">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color as string }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}
