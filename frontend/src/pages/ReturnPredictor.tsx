import { motion } from "framer-motion";
import { Beaker, CheckCircle2, Sparkles, Truck, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Gauge } from "@/components/Gauge";
import { Button, Card, InfoTip, Spinner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api, type ReturnPrediction, type UserListItem } from "@/lib/api";
import { cn, fmtInr, tier } from "@/lib/utils";

const CATS = ["Fashion", "Footwear", "Electronics", "Home", "Beauty", "Toys"];

interface Form {
  category: string;
  price: number;
  discount_pct: number;
  payment_mode: string;
  delivery_days: number;
  user_id?: number;
}

const DEFAULTS: Form = { category: "Fashion", price: 1999, discount_pct: 30, payment_mode: "Prepaid", delivery_days: 4 };

export function ReturnPredictor() {
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [result, setResult] = useState<ReturnPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<UserListItem[]>([]);
  const toast = useToast();

  useEffect(() => {
    api.users("?sort=returns&limit=10").then((d) => setCustomers(d.items)).catch(() => {});
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const r = await api.predictReturn(form);
      setResult(r);
      toast(`Return probability: ${(r.probability * 100).toFixed(0)}% (${r.tier})`, "info");
    } catch {
      toast("Prediction failed — is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  };

  const tryHigh = () => {
    const risky = customers[0];
    setForm({ category: "Footwear", price: 1299, discount_pct: 72, payment_mode: "COD", delivery_days: 9, user_id: risky?.id });
  };
  const tryLow = () => setForm({ category: "Electronics", price: 5499, discount_pct: 5, payment_mode: "Prepaid", delivery_days: 2, user_id: undefined });

  const maxImpact = result ? Math.max(...result.factors.map((f) => Math.abs(f.impact)), 0.01) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Return Risk Predictor</h1>
        <p className="text-sm text-slate-400">
          Score a hypothetical order live. The model returns a calibrated probability, the driving factors and a recommended action.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* form */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent-cyan" />
            <h3 className="font-semibold">Order details</h3>
          </div>

          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("category", c)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", form.category === c ? "bg-accent-gradient text-white" : "border border-white/10 text-slate-400 hover:bg-white/5")}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Order value — ${fmtInr(form.price)}`}>
            <input type="range" min={199} max={20000} step={100} value={form.price} onChange={(e) => set("price", +e.target.value)} className="w-full accent-accent-violet" />
          </Field>

          <Field label={`Discount — ${form.discount_pct}%`} tip="Deep discounts correlate with impulse buys and higher returns.">
            <input type="range" min={0} max={80} value={form.discount_pct} onChange={(e) => set("discount_pct", +e.target.value)} className="w-full accent-accent-violet" />
          </Field>

          <Field label="Payment mode" tip="Cash-on-delivery orders are returned more often than prepaid.">
            <div className="flex gap-1.5">
              {["Prepaid", "COD"].map((m) => (
                <button key={m} onClick={() => set("payment_mode", m)} className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-medium transition", form.payment_mode === m ? "bg-accent-gradient text-white" : "border border-white/10 text-slate-400 hover:bg-white/5")}>
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Delivery time — ${form.delivery_days} days`}>
            <input type="range" min={1} max={15} value={form.delivery_days} onChange={(e) => set("delivery_days", +e.target.value)} className="w-full accent-accent-violet" />
          </Field>

          <Field label="Customer" tip="An existing customer's Bayesian-smoothed return history feeds the model. A new customer uses the population prior.">
            <select
              value={form.user_id ?? ""}
              onChange={(e) => set("user_id", e.target.value ? +e.target.value : undefined)}
              className="w-full rounded-xl border border-white/10 bg-bg-soft px-3 py-2 text-sm outline-none"
            >
              <option value="">New customer (no history)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {(c.return_rate * 100).toFixed(0)}% return rate
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-4 flex gap-2">
            <Button onClick={submit} disabled={loading} className="flex-1">
              {loading ? <Spinner /> : <><Sparkles className="h-4 w-4" /> Predict</>}
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={tryLow} className="flex-1 text-xs">
              <Beaker className="h-3.5 w-3.5" /> Low-risk example
            </Button>
            <Button variant="outline" onClick={tryHigh} className="flex-1 text-xs">
              <Beaker className="h-3.5 w-3.5" /> High-risk example
            </Button>
          </div>
        </Card>

        {/* result */}
        <div className="lg:col-span-3">
          {!result ? (
            <Card className="grid h-full min-h-[360px] place-items-center text-center">
              <div className="max-w-xs text-slate-400">
                <Truck className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="text-sm">Fill the form and hit <b>Predict</b>, or load an example to see a live return-risk assessment.</p>
              </div>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid h-full gap-4 md:grid-cols-2">
              <Card className="flex flex-col items-center justify-center">
                <Gauge value={result.probability * 100} suffix="%" label="P(return)" color={tier(result.tier).hex} size={200} />
                <span className={cn("mt-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset", tier(result.tier).bg, tier(result.tier).text, tier(result.tier).ring)}>
                  {result.tier} risk
                </span>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="mb-3 flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold">Contributing factors</h3>
                    <InfoTip text="Each bar is the factor's contribution to the log-odds of a return (from the calibrated logistic model). Red pushes risk up, green pulls it down." />
                  </div>
                  <div className="space-y-2.5">
                    {result.factors.map((f) => {
                      const up = f.direction === "increases";
                      return (
                        <div key={f.factor}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-slate-400">{f.factor}</span>
                            <span className={up ? "text-risk-high" : "text-risk-low"}>{up ? "↑" : "↓"} {Math.abs(f.impact).toFixed(2)}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full" style={{ width: `${(Math.abs(f.impact) / maxImpact) * 100}%`, background: up ? "#FB7185" : "#34D399" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className={cn("ring-1 ring-inset", tier(result.tier).ring)}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={cn("mt-0.5 h-5 w-5", tier(result.tier).text)} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Recommended action</p>
                      <p className="mt-0.5 text-sm font-medium">{result.action}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {label}
        {tip && <InfoTip text={tip} />}
      </label>
      {children}
    </div>
  );
}
