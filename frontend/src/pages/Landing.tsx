import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  MessageSquareWarning,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Gauge } from "@/components/Gauge";
import { useCountUp } from "@/lib/hooks";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Bayesian Trust Score",
    desc: "Beta-Binomial posterior with a 95% credible interval — confidence, not just an average.",
  },
  {
    icon: RotateCcw,
    title: "Return Risk Prediction",
    desc: "Calibrated probability that an order will be returned, with the factors driving it.",
  },
  {
    icon: ShieldAlert,
    title: "Fraud User Detection",
    desc: "Isolation Forest + calibrated logistic flags wardrobing, multi-accounting and abuse.",
  },
  {
    icon: MessageSquareWarning,
    title: "Fake Review Detection",
    desc: "ComplementNB on text fused with behavioural signals to score P(fake) per review.",
  },
];

const STATS = [
  { value: 5, label: "ML models", suffix: "" },
  { value: 15000, label: "orders modelled", suffix: "+" },
  { value: 8000, label: "reviews scored", suffix: "+" },
  { value: 95, label: "credible interval", suffix: "%" },
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* backgrounds */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-[-10%] h-96 w-96 animate-float rounded-full bg-accent-violet/30 blur-3xl" />
        <div
          className="absolute right-[-10%] top-[12%] h-[30rem] w-[30rem] animate-float rounded-full bg-accent-cyan/20 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="absolute bottom-[-10%] left-1/3 h-80 w-80 animate-float rounded-full bg-fuchsia-500/20 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TrustLens</span>
        </div>
        <Link
          to="/dashboard"
          className="sheen inline-flex items-center gap-2 rounded-xl bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:opacity-95"
        >
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-8 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            Probabilistic Machine Learning · Final Year Project
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl"
          >
            Consumer Trust &<br />
            <span className="gradient-text">Product Risk</span>, quantified.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-slate-400"
          >
            Predict trust, returns and fraud — with confidence, not guesses. Every score ships
            with a probability and an uncertainty estimate.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/dashboard"
              className="sheen inline-flex items-center gap-2 rounded-xl bg-accent-gradient px-6 py-3 font-medium text-white shadow-glow transition hover:opacity-95"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/returns"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/5"
            >
              Try the Live Predictor
            </Link>
          </motion.div>

          {/* stat ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </motion.div>
        </div>

        {/* preview panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
          style={{ perspective: 1000 }}
        >
          <HeroPreview />
        </motion.div>
      </section>

      {/* features */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass hover-lift sheen p-5"
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-cyan">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* credits */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="glass grid grid-cols-1 gap-6 p-7 md:grid-cols-3">
          <Credit label="Submitted by" value="Student Name" hint="Roll No. / Reg. No." />
          <Credit label="Guided by" value="Guide Name" hint="Designation, Department" />
          <Credit label="Institution" value="College Name" hint="University · Academic Year" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Placeholders above are editable in <code className="text-slate-400">src/pages/Landing.tsx</code>.
        </p>
      </section>
    </div>
  );
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const v = useCountUp(value, 1400);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-xl font-bold tabular-nums tracking-tight">
        {value >= 1000 ? Math.round(v).toLocaleString() : Math.round(v)}
        <span className="text-accent-cyan">{suffix}</span>
      </p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="glass relative p-5 shadow-glass">
      <div className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-accent-gradient opacity-20 blur-xl" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-risk-high/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-med/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-low/70" />
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-risk-low" /> live assessment
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Gauge value={82} low={74} high={89} size={132} suffix="" label="Trust" color="#34D399" />
        <div className="flex-1 space-y-3">
          <PreviewBar label="Return risk" value={0.28} color="#FBBF24" />
          <PreviewBar label="Fraud score" value={0.07} color="#34D399" />
          <PreviewBar label="Product risk" value={0.41} color="#FBBF24" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-slate-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> "Best ever super!!!"
          </span>
          <span className="rounded-full bg-risk-high/15 px-2 py-0.5 font-semibold text-risk-high">
            Likely Fake 87%
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-slate-300">
            <BadgeCheck className="h-3.5 w-3.5 text-risk-low" /> 95% credible interval
          </span>
          <span className="font-semibold tabular-nums text-slate-200">74 – 89</span>
        </div>
      </div>
    </div>
  );
}

function PreviewBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </div>
  );
}

function Credit({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="text-center md:text-left">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-sm text-slate-400">{hint}</p>
    </div>
  );
}
