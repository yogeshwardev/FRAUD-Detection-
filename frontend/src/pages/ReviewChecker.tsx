import { motion } from "framer-motion";
import { AlertCircle, MessageSquareWarning, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { Button, Card, InfoTip, Spinner } from "@/components/ui";
import { api, type ReviewPrediction } from "@/lib/api";
import { cn, pct } from "@/lib/utils";

const EXAMPLES = {
  fake: { text: "Nice product very good super best quality buy now awesome!!!", rating: 5, verified: false },
  genuine: {
    text: "Ordered these running shoes in size 9 and they fit true to size. The cushioning is comfortable on long walks and the build quality feels solid after three weeks of daily use.",
    rating: 4,
    verified: true,
  },
};

export function ReviewChecker() {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [verified, setVerified] = useState(false);
  const [result, setResult] = useState<ReviewPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      setResult(await api.predictReview({ text, rating, verified_purchase: verified }));
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (k: keyof typeof EXAMPLES) => {
    const e = EXAMPLES[k];
    setText(e.text);
    setRating(e.rating);
    setVerified(e.verified);
    setResult(null);
  };

  const suspiciousSet = new Set((result?.suspicious_words ?? []).concat(result?.risk_keywords ?? []));
  const fake = result && result.probability >= 0.5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fake Review Checker</h1>
        <p className="text-sm text-slate-500">
          Paste any review. A ComplementNB text model fused with behavioural features estimates the probability it's fake.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-accent-cyan" />
            <h3 className="font-semibold">Review text</h3>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste a product review here…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-accent-violet/40"
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setRating(r)} aria-label={`${r} stars`}>
                  <Star className={cn("h-5 w-5 transition", r <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600")} />
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="accent-accent-violet" />
              Verified purchase
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={check} disabled={loading || !text.trim()} className="flex-1">
              {loading ? <Spinner /> : <><Sparkles className="h-4 w-4" /> Check review</>}
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={() => loadExample("fake")} className="flex-1 text-xs">Fake example</Button>
            <Button variant="outline" onClick={() => loadExample("genuine")} className="flex-1 text-xs">Genuine example</Button>
          </div>
        </Card>

        <Card>
          {!result ? (
            <div className="grid h-full min-h-[280px] place-items-center text-center text-slate-500">
              <div>
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="text-sm">Results will appear here with the suspicious words highlighted.</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Verdict</p>
                  <p className={cn("text-xl font-bold", fake ? "text-risk-high" : "text-risk-low")}>{result.tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tabular-nums" style={{ color: fake ? "#FB7185" : "#34D399" }}>
                    {pct(result.probability)}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-xs text-slate-500">
                    P(fake) · {result.confidence} confidence
                    <InfoTip text="Confidence reflects how far the probability sits from the 50% decision boundary." />
                  </p>
                </div>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.probability * 100}%`, background: fake ? "#FB7185" : "#34D399" }} />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Review with flags</p>
                <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed">
                  {text.split(/(\s+)/).map((w, i) => {
                    const clean = w.toLowerCase().replace(/[^a-z']/g, "");
                    return suspiciousSet.has(clean) ? (
                      <mark key={i} className="rounded bg-risk-high/25 px-0.5 text-risk-high">{w}</mark>
                    ) : (
                      <span key={i}>{w}</span>
                    );
                  })}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Why</p>
                <ul className="space-y-1.5">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", fake ? "bg-risk-high" : "bg-risk-low")} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
