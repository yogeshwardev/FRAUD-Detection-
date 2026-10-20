import { Activity, GitCompareArrows, Scale } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, ChartTooltip } from "@/components/charts";
import { Card, InfoTip, Skeleton } from "@/components/ui";
import { api, type Metric, type ModelMetrics } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "fake_review", label: "Fake Review" },
  { key: "return_risk", label: "Return Risk" },
  { key: "fraud", label: "Fraud User" },
  { key: "product_risk", label: "Product Risk" },
] as const;

export function ModelPerformance() {
  const { data, loading } = useQuery(() => api.metrics(), []);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("fraud");

  if (loading || !data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96" />
      </div>
    );

  const { primary, others } = pickModels(data, tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Model Performance</h1>
        <p className="text-sm text-slate-400">
          Held-out evaluation (25% test split). Every classifier is compared against a non-probabilistic baseline.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("rounded-xl px-4 py-2 text-sm font-medium transition", tab === t.key ? "bg-accent-gradient text-white shadow-glow" : "border border-white/10 text-slate-400 hover:bg-white/5")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* primary metrics */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">{primary.model ?? "Primary model"}</h3>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-cyan">probabilistic</span>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          <Stat label="Accuracy" value={primary.accuracy} />
          <Stat label="Precision" value={primary.precision} tip="Of items flagged, how many were truly positive." />
          <Stat label="Recall" value={primary.recall} tip="Of truly positive items, how many were caught." />
          <Stat label="F1" value={primary.f1} />
          <Stat label="ROC-AUC" value={primary.roc_auc} tip="Ranking quality — 1.0 perfect, 0.5 random." />
          <Stat label="Brier" value={primary.brier} invert tip="Mean squared error of the probabilities. Lower = better-calibrated." />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHead title="ROC Curve" tip="True-positive vs false-positive rate across thresholds. The further above the diagonal, the better." />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={primary.roc_curve} margin={{ left: -24, bottom: -6 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="tpr" type="number" domain={[0, 1]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="tpr" stroke={CHART.violet} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHead title="Confusion Matrix" tip="Counts of predicted vs actual classes on the test set." />
          <ConfusionMatrix cm={primary.confusion_matrix} />
        </Card>

        <Card>
          <CardHead title="Calibration Curve" tip="Predicted probability vs observed frequency. A well-calibrated model hugs the diagonal." />
          {primary.calibration_curve.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={primary.calibration_curve} margin={{ left: -24, bottom: -6 }}>
                <CartesianGrid stroke={CHART.grid} />
                <XAxis dataKey="pred" type="number" domain={[0, 1]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="actual" type="number" domain={[0, 1]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="actual" stroke={CHART.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="grid h-[240px] place-items-center text-sm text-slate-500">Not enough test points to plot.</p>
          )}
        </Card>
      </div>

      {/* baseline comparison */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">Probabilistic model vs baselines</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2">Model</th>
                <th className="pb-2">Accuracy</th>
                <th className="pb-2">Precision</th>
                <th className="pb-2">Recall</th>
                <th className="pb-2">F1</th>
                <th className="pb-2">AUC</th>
                <th className="pb-2">Brier</th>
              </tr>
            </thead>
            <tbody>
              <Row m={primary} highlight />
              {others.map((m, i) => (
                <Row key={i} m={m} />
              ))}
            </tbody>
          </table>
        </div>
        {others.some((o) => o.note) && (
          <p className="mt-3 text-xs text-slate-500">
            {others.find((o) => o.note)?.note}
          </p>
        )}
      </Card>

      {/* probabilistic vs traditional narrative */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">Why probability &amp; uncertainty matter</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.comparison.one_order_one_return && (
            <div className="rounded-xl bg-accent-soft/50 p-4">
              <p className="text-sm font-semibold">The 1-order, 1-return trap</p>
              <div className="my-3 flex items-center gap-4">
                <Pill label="Naïve rate" value={`${data.comparison.one_order_one_return.naive_return_rate}%`} tone="high" />
                <span className="text-slate-500">→</span>
                <Pill label="Bayesian rate" value={`${data.comparison.one_order_one_return.bayes_return_rate}%`} tone="low" />
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{data.comparison.one_order_one_return.explanation}</p>
            </div>
          )}
          {data.comparison.trust_gap_example && (
            <div className="rounded-xl bg-accent-soft/50 p-4">
              <p className="text-sm font-semibold">Fake reviews inflate plain averages</p>
              <div className="my-3 flex items-center gap-4">
                <Pill label="Naïve rating" value={`${data.comparison.trust_gap_example.naive_rating}★`} tone="high" />
                <span className="text-slate-500">→</span>
                <Pill label="Bayesian rating" value={`${data.comparison.trust_gap_example.bayesian_rating}★`} tone="low" />
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                For product #{data.comparison.trust_gap_example.product_id}, down-weighting likely-fake reviews and shrinking toward the
                prior lowers the rating by {data.comparison.trust_gap_example.gap.toFixed(2)}★ — a more honest estimate ({data.comparison.trust_gap_example.confidence} confidence).
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function pickModels(data: ModelMetrics, tab: string): { primary: Metric; others: Metric[] } {
  if (tab === "fake_review") return { primary: data.fake_review.primary, others: [data.fake_review.baseline] };
  if (tab === "fraud") return { primary: data.fraud.primary, others: [data.fraud.baseline] };
  if (tab === "product_risk") return { primary: data.product_risk.primary, others: [data.product_risk.gaussian_nb, data.product_risk.baseline] };
  const r = data.return_risk;
  const primary = r.best === "gaussian_nb" ? r.gaussian_nb : r.logistic;
  const others = r.best === "gaussian_nb" ? [r.logistic, r.baseline] : [r.gaussian_nb, r.baseline];
  return { primary, others };
}

function Stat({ label, value, tip, invert }: { label: string; value: number; tip?: string; invert?: boolean }) {
  const good = invert ? value < 0.15 : value > 0.8;
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className={cn("text-xl font-bold tabular-nums", good ? "text-risk-low" : "text-slate-200")}>{value.toFixed(3)}</p>
      <p className="flex items-center gap-1 text-[11px] text-slate-500">
        {label}
        {tip && <InfoTip text={tip} />}
      </p>
    </div>
  );
}

function Row({ m, highlight }: { m: Metric; highlight?: boolean }) {
  return (
    <tr className={cn("border-t border-white/5", highlight && "bg-accent-soft/30")}>
      <td className="py-2 pr-2 font-medium">
        {m.model}
        {highlight && <span className="ml-2 rounded-full bg-accent-gradient px-1.5 py-0.5 text-[9px] text-white">OURS</span>}
      </td>
      <td className="tabular-nums">{m.accuracy.toFixed(3)}</td>
      <td className="tabular-nums">{m.precision.toFixed(3)}</td>
      <td className="tabular-nums">{m.recall.toFixed(3)}</td>
      <td className="tabular-nums">{m.f1.toFixed(3)}</td>
      <td className="tabular-nums">{m.roc_auc.toFixed(3)}</td>
      <td className="tabular-nums">{m.brier.toFixed(3)}</td>
    </tr>
  );
}

function ConfusionMatrix({ cm }: { cm: number[][] }) {
  const max = Math.max(...cm.flat(), 1);
  const labels = ["Negative", "Positive"];
  const cell = (v: number, diag: boolean) => {
    const a = v / max;
    return diag ? `rgba(52,211,153,${0.15 + a * 0.55})` : `rgba(251,113,133,${0.12 + a * 0.5})`;
  };
  return (
    <div className="grid h-[240px] place-items-center">
      <div>
        <div className="mb-1 grid grid-cols-[auto_1fr_1fr] gap-1 text-[10px] text-slate-500">
          <span />
          <span className="text-center">Pred Neg</span>
          <span className="text-center">Pred Pos</span>
        </div>
        {cm.map((row, i) => (
          <div key={i} className="mb-1 grid grid-cols-[auto_1fr_1fr] items-center gap-1">
            <span className="w-14 text-right text-[10px] text-slate-500">{labels[i]}</span>
            {row.map((v, j) => (
              <div key={j} className="grid h-16 w-24 place-items-center rounded-lg text-lg font-bold tabular-nums" style={{ background: cell(v, i === j) }}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardHead({ title, tip }: { title: string; tip?: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "high" | "low" }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-bold tabular-nums", tone === "high" ? "text-risk-high" : "text-risk-low")}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
