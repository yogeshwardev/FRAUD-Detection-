import { motion } from "framer-motion";
import { useCountUp } from "@/lib/hooks";

/**
 * Animated radial gauge (270° sweep). `value` is 0..100. Optional credible
 * interval band [low, high] is drawn as a lighter arc behind the value arc.
 */
export function Gauge({
  value,
  low,
  high,
  size = 180,
  label,
  suffix = "",
  color = "#8B5CF6",
  track = "rgba(100,116,139,0.18)",
  ticks = true,
}: {
  value: number;
  low?: number;
  high?: number;
  size?: number;
  label?: string;
  suffix?: string;
  color?: string;
  track?: string;
  ticks?: boolean;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sweep = 0.75; // 270° gauge
  const arc = c * sweep;
  const animated = useCountUp(value, 1200);

  const pctToOffset = (v: number) => arc - (Math.max(0, Math.min(100, v)) / 100) * arc;
  const rot = 135; // start angle
  const cx = size / 2;
  const cy = size / 2;

  // tick marks along the 270° arc (0..100)
  const tickEls = ticks
    ? Array.from({ length: 11 }).map((_, i) => {
        const ang = ((135 + (i / 10) * 270) * Math.PI) / 180;
        const inner = r - stroke / 2 - 4;
        const outer = r - stroke / 2 - (i % 5 === 0 ? 11 : 7);
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(ang)}
            y1={cy + inner * Math.sin(ang)}
            x2={cx + outer * Math.cos(ang)}
            y2={cy + outer * Math.sin(ang)}
            stroke="rgba(148,163,184,0.45)"
            strokeWidth={i % 5 === 0 ? 2 : 1}
          />
        );
      })
    : null;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* inner glow */}
        <circle cx={cx} cy={cy} r={r - stroke} fill={color} opacity={0.08} />
        {tickEls}
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={stroke}
            strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
          {/* credible interval band */}
          {low !== undefined && high !== undefined && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity={0.25}
              strokeWidth={stroke} strokeDasharray={`${((high - low) / 100) * arc} ${c}`}
              strokeDashoffset={-((low / 100) * arc)} strokeLinecap="round" />
          )}
          {/* value */}
          <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${arc} ${c}`} strokeLinecap="round"
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: pctToOffset(value) }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}77)` }} />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {animated.toFixed(suffix === "%" ? 0 : value % 1 === 0 ? 0 : 1)}
          <span className="text-xl text-slate-500">{suffix}</span>
        </span>
        {label && <span className="mt-0.5 text-xs text-slate-500">{label}</span>}
      </div>
    </div>
  );
}
