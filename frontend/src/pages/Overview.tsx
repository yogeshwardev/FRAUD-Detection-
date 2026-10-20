import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  MessageSquareWarning,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, ChartTooltip, TIER_COLORS } from "@/components/charts";
import { InfoTip, MotionCard, Skeleton } from "@/components/ui";
import { useCountUp } from "@/lib/hooks";
import { useQuery } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn, tier } from "@/lib/utils";

export function Overview() {
  const { data, loading } = useQuery(() => api.overview(), []);

  if (loading || !data)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );

  const k = data.kpis;
  const kpis = [
    { label: "Avg Trust Score", value: k.avg_trust, suffix: "", icon: ShieldCheck, tip: "Mean Bayesian trust across all products (0–100), with fake reviews down-weighted." },
    { label: "Predicted Return Rate", value: k.pred_return_rate, suffix: "%", icon: RotateCcw, tip: "Share of orders predicted / observed to be returned across the catalogue." },
    { label: "Fraud Users Flagged", value: k.fraud_flagged, suffix: "", icon: ShieldAlert, tip: "Users in the Medium or High fraud-probability tier." },
    { label: "High-Risk Products", value: k.high_risk_products, suffix: "", icon: AlertTriangle, tip: "Products with P(high risk) ≥ 70%." },
    { label: "Fake Reviews Detected", value: k.fake_reviews, suffix: "", icon: MessageSquareWarning, tip: "Reviews with P(fake) ≥ 50%." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-slate-400">
          {k.total_products} products · {k.total_users.toLocaleString()} users ·{" "}
          {k.total_orders.toLocaleString()} orders · {k.total_reviews.toLocaleString()} reviews
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((kpi, i) => (
          <Kpi key={kpi.label} {...kpi} delay={i * 0.06} />
        ))}
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MotionCard delay={0.1}>
          <CardHead title="Return Risk by Category" tip="Observed return rate per product category — Fashion & Footwear lead due to sizing friction." />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.return_by_category} margin={{ left: -18, right: 8, top: 8 }}>
              <XAxis dataKey="category" tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<ChartTooltip unit="%" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.violet} />
                  <stop offset="100%" stopColor={CHART.cyan} />
                </linearGradient>
              </defs>
              <Bar dataKey="rate" name="return rate" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MotionCard>

        <MotionCard delay={0.16}>
          <CardHead title="Fraud Tier Distribution" tip="How users split across Low / Medium / High fraud-probability tiers." />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={260}>
              <PieChart>
                <Pie
                  data={data.fraud_tiers}
                  dataKey="count"
                  nameKey="tier"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.fraud_tiers.map((t) => (
                    <Cell key={t.tier} fill={TIER_COLORS[t.tier]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {data.fraud_tiers.map((t) => (
                <div key={t.tier} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: TIER_COLORS[t.tier] }} />
                    {t.tier}
                  </span>
                  <span className="font-semibold tabular-nums">{t.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </MotionCard>

        <MotionCard delay={0.22}>
          <CardHead title="Trust Score Distribution" tip="Histogram of Bayesian trust scores across the product catalogue." />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.trust_hist} margin={{ left: -18, right: 8, top: 8 }}>
              <XAxis dataKey="bucket" tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={48} />
              <YAxis tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" name="products" fill={CHART.cyan} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MotionCard>

        <MotionCard delay={0.28}>
          <CardHead title="Returns Over Time" tip="Monthly order volume and returns — watch the return-rate trend." />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.returns_trend} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.violet} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="returns" stroke={CHART.violet} fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </MotionCard>
      </div>

      {/* tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MotionCard delay={0.1}>
          <CardHead title="Top 10 Risky Products" icon={<Boxes className="h-4 w-4" />} />
          <div className="divide-y divide-white/5">
            {data.top_risky_products.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3 py-2.5 transition hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category} · Trust {p.trust}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tier("High").bg, tier("High").text)}>
                  {(p.risk_prob * 100).toFixed(0)}%
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-600" />
              </Link>
            ))}
          </div>
        </MotionCard>

        <MotionCard delay={0.16}>
          <CardHead title="Top 10 Suspicious Users" icon={<ShieldAlert className="h-4 w-4" />} />
          <div className="divide-y divide-white/5">
            {data.top_fraud_users.map((u) => (
              <Link key={u.id} to={`/fraud/${u.id}`} className="flex items-center gap-3 py-2.5 transition hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {u.patterns.length ? u.patterns.join(" · ") : "No strong patterns"}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tier(u.tier).bg, tier(u.tier).text)}>
                  {(u.fraud_prob * 100).toFixed(0)}%
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-600" />
              </Link>
            ))}
          </div>
        </MotionCard>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  icon: Icon,
  tip,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: React.ElementType;
  tip: string;
  delay: number;
}) {
  const v = useCountUp(value);
  return (
    <MotionCard delay={delay} className="p-4 hover-lift">
      <div className="mb-3 flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent-cyan">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <InfoTip text={tip} />
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight">
        {Number.isInteger(value) ? Math.round(v).toLocaleString() : v.toFixed(1)}
        <span className="text-base text-slate-400">{suffix}</span>
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </MotionCard>
  );
}

function CardHead({ title, tip, icon }: { title: string; tip?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon && <span className="text-accent-cyan">{icon}</span>}
      <h3 className="font-semibold">{title}</h3>
      {tip && <InfoTip text={tip} />}
      <div className="flex-1" />
      {!icon && <TrendingUp className="h-4 w-4 text-slate-600" />}
    </div>
  );
}
