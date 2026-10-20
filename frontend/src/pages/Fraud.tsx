import { motion } from "framer-motion";
import { Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { cn, tier } from "@/lib/utils";

const TIERS = ["", "High", "Medium", "Low"];

export function Fraud() {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useMemo(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const q = `?tier=${filter}&search=${encodeURIComponent(debounced)}&sort=fraud&limit=60`;
  const { data, loading } = useQuery(() => api.users(q), [q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fraud User Detection</h1>
        <p className="text-sm text-slate-400">
          Isolation Forest anomaly scores fused with a calibrated logistic model yield a probability of fraud per user.
        </p>
      </div>

      <div className="glass flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" />
        </div>
        <div className="flex gap-1.5">
          {TIERS.map((t) => (
            <button
              key={t || "all"}
              onClick={() => setFilter(t)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition", filter === t ? "bg-accent-gradient text-white" : "border border-white/10 text-slate-400 hover:bg-white/5")}
            >
              {t || "All"} {t && "tier"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState title="No users match" hint="Try a different tier or search." />
      ) : (
        <div className="glass divide-y divide-white/5 overflow-hidden p-0">
          {data.items.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.015, 0.25) }}>
              <Link to={`/fraud/${u.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-cyan">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {u.total_orders} orders · {u.total_returns} returns ·{" "}
                    {u.patterns.length ? u.patterns.join(", ") : "no strong patterns"}
                  </p>
                </div>
                <div className="hidden w-40 sm:block">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                    <span>fraud</span>
                    <span className="tabular-nums">{(u.fraud_prob * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${u.fraud_prob * 100}%`, background: tier(u.tier).hex }} />
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tier(u.tier).bg, tier(u.tier).text, tier(u.tier).ring)}>
                  {u.tier}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
