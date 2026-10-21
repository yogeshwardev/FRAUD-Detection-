import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AssuredBadge, ProductCard } from "@/components/store/ProductCard";
import { Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { CATEGORIES, starRating } from "@/lib/shop";
import { cn } from "@/lib/utils";

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
  { label: "₹20,000 – ₹50,000", min: 20000, max: 50000 },
  { label: "Above ₹50,000", min: 50000, max: Infinity },
];

const SORTS = [
  { v: "popular", l: "Popularity" },
  { v: "price_asc", l: "Price -- Low to High" },
  { v: "price_desc", l: "Price -- High to Low" },
  { v: "trust", l: "Most Trusted" },
];

const PAGE_SIZE = 24;

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const [sort, setSort] = useState("popular");
  const [price, setPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [assuredOnly, setAssuredOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const q = `?search=${encodeURIComponent(search)}&category=${category}&sort=trust&distinct=true&limit=500`;
  const { data, loading } = useQuery(() => api.products(q), [q]);

  useEffect(() => setPage(1), [q, sort, price, minRating, assuredOnly]);

  const filtered = useMemo(() => {
    let list = data?.items ?? [];
    if (price !== null) {
      const r = PRICE_RANGES[price];
      list = list.filter((p) => p.price >= r.min && p.price < r.max);
    }
    if (minRating) list = list.filter((p) => starRating(p.trust) >= minRating);
    if (assuredOnly) list = list.filter((p) => p.trust >= 75);
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.n_reviews - a.n_reviews);
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "trust") sorted.sort((a, b) => b.trust - a.trust);
    return sorted;
  }, [data, price, minRating, assuredOnly, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c) next.set("category", c);
    else next.delete("category");
    setParams(next);
  };
  const clearAll = () => {
    setPrice(null);
    setMinRating(0);
    setAssuredOnly(false);
    setParams(new URLSearchParams());
  };

  const title = search ? `Results for "${search}"` : category || "All products";

  return (
    <div className="mx-auto grid max-w-[1280px] gap-2 px-2 py-2 md:grid-cols-[260px_1fr] md:px-3">
      {/* filters */}
      <aside className="self-start bg-white">
        <div className="flex items-center justify-between border-b border-fk-line px-4 py-3">
          <button className="flex items-center gap-2 text-lg font-semibold md:pointer-events-none" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal className="h-4 w-4 md:hidden" /> Filters
          </button>
          <button onClick={clearAll} className="text-xs font-semibold uppercase text-fk-blue">Clear all</button>
        </div>
        <div className={cn("md:block", showFilters ? "block" : "hidden")}>
          <FilterBlock title="Categories">
            <FilterOption active={!category} onClick={() => setCategory("")}>All products</FilterOption>
            {CATEGORIES.map((c) => (
              <FilterOption key={c} active={category === c} onClick={() => setCategory(c)}>{c}</FilterOption>
            ))}
          </FilterBlock>
          <FilterBlock title="Price">
            {PRICE_RANGES.map((r, i) => (
              <Check key={r.label} checked={price === i} onChange={() => setPrice(price === i ? null : i)} label={r.label} />
            ))}
          </FilterBlock>
          <FilterBlock title="Customer ratings">
            {[4, 3.5].map((r) => (
              <Check key={r} checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} label={`${r}★ & above`} />
            ))}
          </FilterBlock>
          <FilterBlock title="Seller trust">
            <Check checked={assuredOnly} onChange={() => setAssuredOnly((v) => !v)} label={<AssuredBadge small />} />
          </FilterBlock>
        </div>
      </aside>

      {/* results */}
      <section className="min-w-0 bg-white">
        <div className="border-b border-fk-line px-4 pt-3">
          <div className="flex items-center gap-1 text-xs text-fk-muted">
            <Link to="/" className="hover:text-fk-blue">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{title}</span>
          </div>
          <h1 className="mt-1 text-base font-semibold text-fk-ink">
            {title}{" "}
            <span className="text-xs font-normal text-fk-muted">
              (Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} – {Math.min(page * PAGE_SIZE, filtered.length)} products of {filtered.length})
            </span>
          </h1>
          <div className="mt-2 flex gap-5 overflow-x-auto text-sm">
            <span className="shrink-0 py-2 font-semibold text-fk-ink">Sort By</span>
            {SORTS.map((s) => (
              <button
                key={s.v}
                onClick={() => setSort(s.v)}
                className={cn("shrink-0 border-b-2 py-2", sort === s.v ? "border-fk-blue font-semibold text-fk-blue" : "border-transparent text-fk-ink hover:text-fk-blue")}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="m-4 aspect-[3/4] rounded-none" />)}
          </div>
        ) : !shown.length ? (
          <div className="px-6 py-20 text-center">
            <p className="text-lg font-semibold">Sorry, no results found!</p>
            <p className="mt-1 text-sm text-fk-muted">Try a different search or clear the filters.</p>
            <button onClick={clearAll} className="mt-4 rounded-sm bg-fk-blue px-6 py-2 text-sm font-semibold text-white">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <div key={p.id} className="border-b border-r border-fk-line">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm">
            <span className="text-fk-ink">Page {page} of {pages}</span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <button onClick={() => setPage(page - 1)} className="px-3 py-1.5 font-semibold uppercase text-fk-blue">Previous</button>
              )}
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPage(i + 1); window.scrollTo({ top: 0 }); }}
                  className={cn("h-8 w-8 rounded-full", page === i + 1 ? "bg-fk-blue font-semibold text-white" : "text-fk-ink hover:bg-fk-bg")}
                >
                  {i + 1}
                </button>
              ))}
              {page < pages && (
                <button onClick={() => { setPage(page + 1); window.scrollTo({ top: 0 }); }} className="px-3 py-1.5 font-semibold uppercase text-fk-blue">Next</button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-fk-line px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fk-ink">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("block w-full text-left text-sm", active ? "font-semibold text-fk-blue" : "text-fk-ink hover:text-fk-blue")}>
      {children}
    </button>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fk-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#2874f0]" />
      {label}
    </label>
  );
}
