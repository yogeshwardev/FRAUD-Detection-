import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MessageSquareWarning,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
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
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: RotateCcw,
    title: "Return Risk Prediction",
    desc: "Calibrated probability that an order will be returned, with the factors driving it.",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    icon: ShieldAlert,
    title: "Fraud User Detection",
    desc: "Isolation Forest + calibrated logistic flags wardrobing, multi-accounting and abuse.",
    tint: "bg-rose-50 text-rose-600",
  },
  {
    icon: MessageSquareWarning,
    title: "Fake Review Detection",
    desc: "ComplementNB on text fused with behavioural signals to score P(fake) per review.",
    tint: "bg-slate-100 text-slate-700",
  },
];

const STATS = [
  { value: 5, label: "ML models", suffix: "" },
  { value: 15000, label: "orders modelled", suffix: "+" },
  { value: 8000, label: "reviews scored", suffix: "+" },
  { value: 95, label: "credible interval", suffix: "%" },
];

const TRUST_POINTS = ["Calibrated probabilities", "Uncertainty on every score", "Trained & evaluated on labelled data"];

export function Landing() {
  return (
    <div className="relative min-h-screen">
      {/* soft corporate header wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{ background: "linear-gradient(180deg,#eef1f6 0%,rgba(238,241,246,0) 100%)" }}
      />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">TrustLens</span>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-95"
        >
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-10 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Probabilistic Machine Learning · Final Year Project
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-[3.3rem]"
          >
            Consumer Trust &amp;{" "}
            <span className="gradient-text">Product Risk</span>, quantified.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-xl text-lg text-slate-600"
          >
            Predict trust, returns and fraud — with confidence, not guesses. Every score ships
            with a probability and an uncertainty estimate.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:opacity-95"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/returns"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Try the Live Predictor
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
            className="mt-7 flex flex-wrap gap-x-6 gap-y-2"
          >
            {TRUST_POINTS.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* preview panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <HeroPreview />
        </motion.div>
      </section>

      {/* stat band */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <div className="glass grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <Stat key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-1 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
          Five probabilistic modules
        </h2>
        <p className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">
          One platform for trust, returns &amp; fraud
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass hover-lift p-5"
            >
              <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${f.tint}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* credits */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="glass grid grid-cols-1 gap-6 p-7 md:grid-cols-3">
          <Credit label="Submitted by" value="Student Name" hint="Roll No. / Reg. No." />
          <Credit label="Guided by" value="Guide Name" hint="Designation, Department" />
          <Credit label="Institution" value="College Name" hint="University · Academic Year" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Placeholders above are editable in <code className="text-slate-600">src/pages/Landing.tsx</code>.
        </p>
      </section>
    </div>
  );
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const v = useCountUp(value, 1400);
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {value >= 1000 ? Math.round(v).toLocaleString() : Math.round(v)}
        <span className="text-slate-900">{suffix}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Live Assessment</p>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> live
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Gauge value={82} low={74} high={89} size={132} suffix="" label="Trust" color="#16a34a" />
        <div className="flex-1 space-y-3">
          <PreviewBar label="Return risk" value={0.28} color="#d97706" />
          <PreviewBar label="Fraud score" value={0.07} color="#16a34a" />
          <PreviewBar label="Product risk" value={0.41} color="#d97706" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-slate-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> "Best ever super!!!"
          </span>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
            Likely Fake 87%
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-slate-600">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> 95% credible interval
          </span>
          <span className="font-semibold tabular-nums text-slate-900">74 – 89</span>
        </div>
      </div>
    </div>
  );
}

function PreviewBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{hint}</p>
    </div>
  );
}
