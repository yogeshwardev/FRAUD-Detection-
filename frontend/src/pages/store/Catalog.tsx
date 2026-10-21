import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { CATEGORIES } from "@/lib/shop";
import { cn } from "@/lib/utils";

const SORTS = [
  { v: "trust", l: "Top rated" },
  { v: "price", l: "Price: high to low" },
  { v: "name", l: "Name" },
  { v: "risk", l: "Highest risk" },
];

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "trust";
  const [limit, setLimit] = useState(48);

  const q = `?search=${encodeURIComponent(search)}&category=${category}&sort=${sort}&limit=${limit}`;
  const { data, loading } = useQuery(() => api.products(q), [q]);

  const setParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
    setLimit(48);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
        <span>Home</span><span>/</span>
        <span className="text-slate-700">{category || "All products"}</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">
        {search ? `Results for “${search}”` : category || "All products"}
      </h1>

      {/* controls */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          <Chip active={!category} onClick={() => setParam("category", "")}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setParam("category", c)}>{c}</Chip>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>Sort: {s.l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      ) : !data?.items.length ? (
        <div className="mt-6"><EmptyState title="No products found" hint="Try a different category or search." /></div>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-500">{data.total} products</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {data.total > data.items.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setLimit((l) => l + 48)}
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
