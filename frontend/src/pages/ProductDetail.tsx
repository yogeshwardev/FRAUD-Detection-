import { ArrowLeft, BadgeCheck, Lightbulb, ShieldAlert, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Gauge } from "@/components/Gauge";
import { Badge, Card, InfoTip, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { cn, fmtInr, pct, tier, trustHex } from "@/lib/utils";

export function ProductDetail() {
  const { id } = useParams();
  const { data, loading } = useQuery(() => api.product(Number(id)), [id]);

  if (loading || !data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );

  const p = data.product;
  const s = data.scores;
  const naivePct = (s.naive_rating / 5) * 100;
  const bayesPct = (s.bayesian_rating / 5) * 100;

  return (
    <div className="space-y-6">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
          <p className="text-sm text-slate-400">
            {p.category} · {fmtInr(p.price)} ·{" "}
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.seller_rating} seller rating
            </span>
          </p>
        </div>
        <Badge className={cn(tier(s.risk_tier).bg, tier(s.risk_tier).text, tier(s.risk_tier).ring)}>
          <ShieldAlert className="h-3.5 w-3.5" /> {s.risk_tier} risk · {pct(s.risk_prob)}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* trust gauge */}
        <Card className="flex flex-col items-center">
          <div className="mb-1 flex items-center gap-1.5 self-start">
            <h3 className="font-semibold">Bayesian Trust Score</h3>
            <InfoTip text="Posterior mean of a Beta-Binomial model over positive vs negative reviews, with each review down-weighted by its probability of being fake." />
          </div>
          <Gauge value={s.trust} low={s.trust_low} high={s.trust_high} suffix="" label="/ 100" color={trustHex(s.trust)} />
          <p className="mt-2 text-center text-sm text-slate-400">
            95% credible interval{" "}
            <span className="font-medium text-slate-200">
              {s.trust_low} – {s.trust_high}
            </span>
          </p>
          <Badge className={cn("mt-2", tier(s.confidence === "High" ? "Low" : s.confidence === "Medium" ? "Medium" : "High").bg)}>
            <BadgeCheck className="h-3.5 w-3.5" /> {s.confidence} confidence
          </Badge>
        </Card>

        {/* naive vs bayesian */}
        <Card>
          <div className="mb-3 flex items-center gap-1.5">
            <h3 className="font-semibold">Naïve vs Bayesian Rating</h3>
            <InfoTip text="A plain average treats every review equally. The Bayesian rating shrinks toward a neutral prior when evidence is thin and discounts likely-fake reviews." />
          </div>
          <Bar label="Naïve average" value={s.naive_rating} pctVal={naivePct} color="#64748B" />
          <Bar label="Bayesian adjusted" value={s.bayesian_rating} pctVal={bayesPct} color={trustHex(s.trust)} />
          <div className="mt-4 rounded-xl bg-accent-soft/60 p-3 text-xs leading-relaxed text-slate-300">
            {s.naive_rating > s.bayesian_rating + 0.2 ? (
              <>The plain average <b>overstates</b> this product by {(s.naive_rating - s.bayesian_rating).toFixed(2)}★ — fake or sparse reviews inflate it. The Bayesian score corrects for that.</>
            ) : s.bayesian_rating > s.naive_rating + 0.2 ? (
              <>The Bayesian score is slightly higher — a few harsh outliers drag the plain average down more than the evidence warrants.</>
            ) : (
              <>Both agree here — enough genuine, consistent reviews make the estimate reliable.</>
            )}
          </div>
        </Card>

        {/* product risk */}
        <Card className="flex flex-col items-center">
          <div className="mb-1 flex items-center gap-1.5 self-start">
            <h3 className="font-semibold">Product Risk</h3>
            <InfoTip text="Calibrated probability that this product is high-risk, from defect-keyword ratio, return rate, defect-reason ratio, seller rating and trust." />
          </div>
          <Gauge value={s.risk_prob * 100} suffix="%" label="P(high risk)" color={tier(s.risk_tier).hex} />
          <div className="mt-2 grid w-full grid-cols-2 gap-2 text-center text-xs">
            <Mini label="Return rate" value={pct(s.return_rate)} />
            <Mini label="Defect reviews" value={pct(s.neg_keyword_ratio)} />
          </div>
        </Card>
      </div>

      {/* why this score */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">Why this score?</h3>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.risk_reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />
              {r}
            </li>
          ))}
        </ul>
      </Card>

      {/* reviews */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-semibold">Reviews</h3>
          <span className="text-xs text-slate-500">
            {data.reviews.length} shown · fake probability per review
          </span>
        </div>
        <div className="space-y-2">
          {data.reviews.map((r) => {
            const fake = r.p_fake >= 0.5;
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <span className="flex items-center gap-0.5 text-sm font-semibold text-amber-400">
                    {r.rating}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  {r.verified_purchase && <span className="mt-1 text-[9px] text-risk-low">verified</span>}
                </div>
                <p className="min-w-0 flex-1 text-sm text-slate-300">{r.text}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                    fake ? "bg-risk-high/15 text-risk-high ring-risk-high/40" : "bg-risk-low/10 text-risk-low ring-risk-low/30",
                  )}
                >
                  {fake ? `Likely Fake ${pct(r.p_fake)}` : `Genuine ${pct(1 - r.p_fake)}`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Bar({ label, value, pctVal, color }: { label: string; value: number; pctVal: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold tabular-nums">{value.toFixed(2)} ★</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, background: color }} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
