import { ArrowLeft, Network, ShieldAlert, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, ChartTooltip } from "@/components/charts";
import { Gauge } from "@/components/Gauge";
import { Badge, Card, InfoTip, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { cn, pct, tier } from "@/lib/utils";

export function FraudDetail() {
  const { id } = useParams();
  const { data, loading } = useQuery(() => api.user(Number(id)), [id]);

  if (loading || !data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );

  const u = data.user;
  const s = data.scores;

  return (
    <div className="space-y-6">
      <Link to="/fraud" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{u.name}</h1>
          <p className="text-sm text-slate-400">
            Account age {u.account_age_days}d · {u.total_orders} orders · {u.total_returns} returns · {u.coupon_uses} coupons
          </p>
        </div>
        <Badge className={cn(tier(s.tier).bg, tier(s.tier).text, tier(s.tier).ring)}>
          <ShieldAlert className="h-3.5 w-3.5" /> {s.tier} tier
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center">
          <div className="mb-1 flex items-center gap-1.5 self-start">
            <h3 className="font-semibold">Fraud Probability</h3>
            <InfoTip text="Calibrated probability combining the Isolation Forest anomaly score with behavioural features." />
          </div>
          <Gauge value={s.fraud_prob * 100} suffix="%" label="P(fraud)" color={tier(s.tier).hex} />
          <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-xs">
            <Mini label="Smoothed return rate" value={pct(s.return_rate_bayes)} tip="Beta-smoothed so a single order doesn't dominate." />
            <Mini label="Anomaly score" value={s.iso_score.toFixed(2)} tip="Isolation Forest outlier score (higher = more anomalous)." />
            <Mini label="Returns ≤ 3 days" value={String(s.returns_within_3)} />
            <Mini label="Review burst" value={String(s.review_burst)} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold">Triggered Fraud Patterns</h3>
            <InfoTip text="Human-readable rationale derived from the features that pushed this user's probability up." />
          </div>
          {s.patterns.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {s.patterns.map((p) => (
                <div key={p.name} className="rounded-xl bg-risk-high/10 p-3 ring-1 ring-inset ring-risk-high/25">
                  <p className="text-sm font-semibold text-risk-high">{p.name}</p>
                  <p className="mt-0.5 text-xs text-slate-300">{p.evidence}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-risk-low/10 p-4 text-sm text-slate-300 ring-1 ring-inset ring-risk-low/25">
              No strong fraud patterns triggered — this user behaves within normal ranges.
            </div>
          )}

          {/* timeline */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Order & return timeline</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={data.timeline} margin={{ left: -20, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="ordG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.cyan} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="orders" stroke={CHART.cyan} fill="url(#ordG)" strokeWidth={2} />
                <Area type="monotone" dataKey="returns" stroke={CHART.high} fill="none" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* linked accounts network */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">Linked Accounts</h3>
          <InfoTip text="Other accounts sharing this user's device or shipping address. Clusters suggest multi-accounting — but legitimate households share too, so the model weighs it probabilistically." />
          <span className="text-xs text-slate-500">({data.linked_accounts.length})</span>
        </div>
        {data.linked_accounts.length ? (
          <NetworkGraph center={u.name} nodes={data.linked_accounts} />
        ) : (
          <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
            <Users className="mr-2 inline h-4 w-4" /> No other accounts share this device or address.
          </p>
        )}
      </Card>

      {/* orders */}
      <Card>
        <h3 className="mb-3 font-semibold">Recent Orders</h3>
        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {data.orders.slice(-30).reverse().map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{o.product}</span>
              <span className="hidden text-xs text-slate-500 sm:block">{o.payment_mode}</span>
              <span className="text-xs text-slate-500">{o.timestamp.slice(0, 10)}</span>
              {o.returned ? (
                <span className="rounded-full bg-risk-high/15 px-2 py-0.5 text-[11px] font-medium text-risk-high">
                  returned{o.days_to_return != null ? ` · ${o.days_to_return}d` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-risk-low/10 px-2 py-0.5 text-[11px] font-medium text-risk-low">kept</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NetworkGraph({
  center,
  nodes,
}: {
  center: string;
  nodes: { id: number; name: string; shares_device: boolean; shares_address: boolean; fraud_prob: number }[];
}) {
  const W = 520, H = 260, cx = W / 2, cy = H / 2;
  const R = Math.min(110, 40 + nodes.length * 10);
  const pts = nodes.map((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { ...n, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full min-w-[480px]">
        {pts.map((p) => (
          <line key={`l${p.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={p.shares_device ? "#8B5CF6" : "#22D3EE"} strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray={p.shares_address && !p.shares_device ? "4 3" : undefined} />
        ))}
        {pts.map((p) => (
          <a key={`n${p.id}`} href={`/fraud/${p.id}`}>
            <circle cx={p.x} cy={p.y} r={18} fill="rgba(251,113,133,0.15)" stroke={p.fraud_prob >= 0.5 ? "#FB7185" : "#64748B"} strokeWidth={2} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={10} fill="#cbd5e1">
              {(p.fraud_prob * 100).toFixed(0)}%
            </text>
            <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {p.name.split(" ")[0]}
            </text>
          </a>
        ))}
        <circle cx={cx} cy={cy} r={26} fill="url(#cg)" />
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
          {center.split(" ")[0]}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-accent-violet" /> shared device</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-accent-cyan" /> shared address</span>
      </div>
    </div>
  );
}

function Mini({ label, value, tip }: { label: string; value: string; tip?: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2">
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
        {label}
        {tip && <InfoTip text={tip} />}
      </p>
    </div>
  );
}
