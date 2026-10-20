import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, InfoTip, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { cn, fmtInr, tier, trustHex } from "@/lib/utils";

const CATS = ["", "Fashion", "Footwear", "Electronics", "Home", "Beauty", "Toys"];
const SORTS = [
  { v: "risk", l: "Highest risk" },
  { v: "trust", l: "Highest trust" },
  { v: "return", l: "Most returned" },
  { v: "price", l: "Price" },
  { v: "name", l: "Name" },
];

export function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("risk");
  const [debounced, setDebounced] = useState("");

  useMemo(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const q = `?search=${encodeURIComponent(debounced)}&category=${category}&sort=${sort}&limit=60`;
  const { data, loading } = useQuery(() => api.products(q), [q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Trust & Risk Explorer</h1>
        <p className="text-sm text-slate-400">
          Every product carries a Bayesian trust score with a confidence level and a calibrated risk probability.
        </p>
      </div>

      {/* controls */}
      <div className="glass flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                category === c ? "bg-accent-gradient text-white" : "border border-white/10 text-slate-400 hover:bg-white/5",
              )}
            >
              {c || "All"}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-white/10 bg-bg-soft px-3 py-2 text-sm outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              Sort: {s.l}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState title="No products match your filters" hint="Try clearing the search or category." />
      ) : (
        <>
          <p className="text-xs text-slate-500">{data.total} products</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Link to={`/products/${p.id}`} className="glass hover-lift sheen group block h-full p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", tier(p.risk_tier).bg, tier(p.risk_tier).text, tier(p.risk_tier).ring)}>
                      {p.risk_tier} risk
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Trust score</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: trustHex(p.trust) }}>
                        {p.trust}
                        <span className="text-sm text-slate-500">/100</span>
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {p.seller_rating} seller
                      </p>
                      <p className="mt-0.5">{fmtInr(p.price)}</p>
                      <p className="mt-0.5">{p.n_reviews} reviews</p>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.trust}%`, background: trustHex(p.trust) }} />
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                    {p.confidence} confidence <InfoTip text="Confidence reflects how wide the 95% credible interval of the trust score is. Fewer reviews → wider interval → lower confidence." />
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
