import { ArrowRight, MessageSquareWarning, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Skeleton } from "@/components/ui";
import { api, type ProductListItem } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { CATEGORIES, pricing } from "@/lib/shop";

export function StoreHome() {
  const { data, loading } = useQuery(() => api.products("?sort=trust&distinct=true&limit=500"), []);
  const items = data?.items ?? [];
  const topRated = items.slice(0, 10);
  const deals = [...items]
    .sort((a, b) => pricing(b.price, b.id).discount - pricing(a.price, a.id).discount)
    .slice(0, 10);
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, items.find((p) => p.category === c)]),
  ) as Record<string, ProductListItem | undefined>;
  const brandCounts = new Map<string, number>();
  for (const p of items) if (p.brand !== "Generic") brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  const brands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([b]) => b);
  const heroPicks = [items.find((p) => p.category === "Electronics"), items.find((p) => p.category === "Fashion"), items.find((p) => p.category === "Beauty")].filter(Boolean) as ProductListItem[];

  return (
    <div>
      {/* hero */}
      <section className="bg-slate-900">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Sparkles className="h-3.5 w-3.5" /> ML-scored shopping
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Shop smart. Every product <span className="text-emerald-400">scored for trust.</span>
            </h1>
            <p className="mt-4 max-w-md text-slate-300">
              {items.length || 157} real products from top brands — each seller scored with a Bayesian
              trust score, fake-review detection and return-risk prediction.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
                Shop all products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Risk Analytics
              </Link>
            </div>
          </div>
          <div className="relative hidden h-80 md:block">
            {heroPicks.map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="absolute h-52 w-52 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10 transition hover:z-10 hover:scale-105"
                style={{ right: 24 + i * 150, top: i % 2 ? 70 : 10, zIndex: 3 - i, transform: `rotate(${(i - 1) * 5}deg)` }}
              >
                <ProductImage src={p.image} category={p.category} name={p.name} className="h-full w-full" eager />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h2 className="mb-5 text-xl font-bold text-slate-900">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/shop?category=${c}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
              <div className="aspect-square overflow-hidden border-b border-slate-100">
                {byCategory[c] ? (
                  <ProductImage src={byCategory[c]!.image} category={c} name={c} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <Skeleton className="h-full w-full rounded-none" />
                )}
              </div>
              <p className="py-2.5 text-center text-sm font-semibold text-slate-800">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* trust strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 md:px-6">
          <Feat icon={ShieldCheck} title="Bayesian trust scores" desc="Ratings corrected for fake reviews, with a confidence level." />
          <Feat icon={MessageSquareWarning} title="Fake reviews flagged" desc="Every review carries a probability of being fake." />
          <Feat icon={RotateCcw} title="Return-risk aware" desc="Know how likely an order is to be returned before you buy." />
        </div>
      </section>

      <Section title="Deals of the day" to="/shop" loading={loading} products={deals} />

      {/* brands */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Top brands</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link
                key={b}
                to={`/shop?search=${encodeURIComponent(b)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                {b}
              </Link>
            ))}
          </div>
        </section>
      )}

      <Section title="Top rated products" to="/shop" loading={loading} products={topRated} />
    </div>
  );
}

function Section({ title, to, products, loading }: { title: string; to: string; products: ProductListItem[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)
          : products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function Feat({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
