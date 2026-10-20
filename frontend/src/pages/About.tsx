import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Brain,
  Database,
  Gauge as GaugeIcon,
  ListChecks,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui";

const PIPELINE = [
  { icon: Database, title: "Data", desc: "300 products · 2k users · 15k orders · 8k reviews (seeded synthetic)" },
  { icon: Boxes, title: "Feature Engineering", desc: "Behavioural, textual (TF-IDF) & Bayesian-smoothed rate features" },
  { icon: Brain, title: "Probabilistic Models", desc: "Naive Bayes · Beta-Binomial · Isolation Forest · Calibrated Logistic" },
  { icon: GaugeIcon, title: "Scores + Confidence", desc: "Every output is a probability with an uncertainty estimate" },
  { icon: ListChecks, title: "Actions", desc: "Flag fraud · require prepaid · down-weight fake reviews" },
];

const CONCEPTS = [
  {
    title: "Naïve Bayes",
    body: "Applies Bayes' theorem assuming features are conditionally independent. We use ComplementNB on TF-IDF review text — it's fast, works well on sparse text, and naturally outputs a probability rather than a hard label.",
  },
  {
    title: "Beta-Binomial (Trust)",
    body: "Models positive vs negative reviews as coin flips with an unknown success rate. Starting from a Beta(2,2) prior, each review updates a posterior. The posterior mean is the trust score; its spread gives a 95% credible interval — our confidence.",
  },
  {
    title: "Isolation Forest",
    body: "An unsupervised anomaly detector that isolates outliers with random splits. Fraudulent users sit far from normal behaviour, so they're isolated in fewer splits. Its anomaly score becomes a feature for the final fraud model.",
  },
  {
    title: "Probability Calibration",
    body: "A model can rank well yet output over-confident probabilities. CalibratedClassifierCV (sigmoid) maps raw scores to honest probabilities, so '70%' really means roughly 70% — essential when a number drives a real action.",
  },
];

export function About() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">How It Works</h1>
        <p className="text-sm text-slate-500">
          From raw synthetic events to calibrated, uncertainty-aware decisions.
        </p>
      </div>

      {/* pipeline */}
      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-accent-cyan" />
          <h3 className="font-semibold">Processing Pipeline</h3>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          {PIPELINE.map((p, i) => (
            <div key={p.title} className="flex flex-1 items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-inset ring-slate-200"
              >
                <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-cyan">
                  <p.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{p.desc}</p>
              </motion.div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-600 lg:block" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* concepts */}
      <div className="grid gap-4 md:grid-cols-2">
        {CONCEPTS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="h-full">
              <h3 className="mb-2 font-semibold gradient-text">{c.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{c.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <h3 className="mb-2 font-semibold">Why synthetic data?</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Real platforms never publish labelled fraud, fake reviews or return outcomes. We generate a reproducible,
          seeded world where ground-truth labels are known, patterns are injected realistically (wardrobing,
          shared devices, review bursts, sizing friction), and deliberate overlap keeps the problem honest — so the
          models earn their accuracy instead of reading the label off a giveaway feature.
        </p>
      </Card>
    </div>
  );
}
