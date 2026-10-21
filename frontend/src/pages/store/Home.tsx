import { ArrowRight, MessageSquareWarning, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { pricing } from "@/lib/shop";
import { CATEGORIES } from "@/lib/shop";

const CAT_REP: Record<string, string> = {
  Fashion: "Cotton Shirt",
  Footwear: "Running Sneakers",
  Electronics: "Wireless Headphones",
  Home: "Table Lamp",
  Beauty: "Matte Lipstick",
  Toys: "Plush Doll",
};

export function StoreHome() {
  const { data, loading } = useQuery(() => api.products("?sort=trust&limit=60"), []);
  const items = data?.items ?? [];
  const topRated = items.slice(0, 10);
  const deals = [...items].sort((a, b) => pricing(b.price, b.id).discount - pricing(a.price, a.id).discount).slice(0, 10);

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
              300 products across 6 categories — each with a Bayesian trust score, fake-review
              detection and return-risk prediction, so you buy with confidence.
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
          <div className="relative hidden h-72 md:block">
            {items.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="absolute h-44 w-44 overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl"
                style={{ right: i * 130, top: i * 40, zIndex: 3 - i, transform: `rotate(${(i - 1) * 6}deg)` }}
              >
                <ProductImage category={p.category} id={p.id} name={p.name} className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h2 className="mb-5 text-xl font-bold text-slate-900">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Link key={c} to={`/shop?category=${c}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
              <div className="aspect-[4/3] overflow-hidden">
                <ProductImage category={c} id={900 + i} name={CAT_REP[c]} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
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

      {/* deals */}
      <Section title="Deals of the day" to="/shop?sort=price" loading={loading} products={deals} />
      {/* top rated */}
      <Section title="Top rated products" to="/shop" loading={loading} products={topRated} />
    </div>
  );
}

function Section({ title, to, products, loading }: { title: string; to: string; products: any[]; loading: boolean }) {
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
