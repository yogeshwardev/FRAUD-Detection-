import { motion } from "framer-motion";
import {
  BadgeCheck, Check, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Truck,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Gauge } from "@/components/Gauge";
import { Skeleton } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCart } from "@/store/cart";
import { api } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { pricing, starRating } from "@/lib/shop";
import { cn, fmtInr, pct, tier, trustHex } from "@/lib/utils";

export function StoreProduct() {
  const { id } = useParams();
  const pid = Number(id);
  const { data, loading } = useQuery(() => api.product(pid), [id]);
  const { add } = useCart();
  const toast = useToast();
  const nav = useNavigate();
  const [qty, setQty] = useState(1);

  if (loading || !data)
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );

  const p = data.product;
  const s = data.scores;
  const rating = starRating(s.trust);
  const { mrp, discount } = pricing(p.price, p.id);
  const fakeCount = data.reviews.filter((r) => r.p_fake >= 0.5).length;

  const addToCart = () => {
    add({ id: p.id, name: p.name, price: p.price, category: p.category }, qty);
    toast(`Added ${qty} × “${p.name}” to cart`, "success");
  };
  const buyNow = () => { addToCart(); nav("/cart"); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link><span>/</span>
        <Link to={`/shop?category=${p.category}`} className="hover:text-slate-900">{p.category}</Link>
        <span>/</span><span className="truncate text-slate-700">{p.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* image */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ProductImage category={p.category} id={p.id} name={p.name} size={800} className="aspect-square w-full" />
          </div>
        </div>

        {/* info */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">{p.category}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{p.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-sm font-semibold text-white">
              {rating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-white" />
            </span>
            <span className="text-sm text-slate-500">{s.n_reviews} ratings</span>
            {s.trust >= 75 && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Trusted product
              </span>
            )}
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-slate-900">{fmtInr(p.price)}</span>
            <span className="text-lg text-slate-400 line-through">{fmtInr(mrp)}</span>
            <span className="pb-1 text-lg font-semibold text-emerald-600">{discount}% off</span>
          </div>
          <p className="text-xs text-slate-400">Inclusive of all taxes</p>

          {/* quantity + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-slate-600 hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center text-slate-600 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={addToCart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-slate-900 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50">
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </button>
            <button onClick={buyNow} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700">
              Buy now
            </button>
          </div>

          {/* delivery */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Perk icon={Truck} text="Free delivery" />
            <Perk icon={RotateCcw} text="7-day returns" />
            <Perk icon={ShieldCheck} text="Trust verified" />
          </div>

          {/* ML trust panel */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900">TrustLens assessment</h3>
            </div>
            <div className="flex items-center gap-5">
              <Gauge value={s.trust} low={s.trust_low} high={s.trust_high} size={120} label="/ 100" color={trustHex(s.trust)} />
              <div className="flex-1 space-y-2 text-sm">
                <Row label="Confidence" value={s.confidence} />
                <Row label="95% credible interval" value={`${s.trust_low} – ${s.trust_high}`} />
                <Row label="Return risk" value={<span className={tier(s.risk_tier).text}>{s.risk_tier}</span>} />
                <Row label="Likely-fake reviews" value={`${fakeCount} of ${data.reviews.length}`} />
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              Rating shown is the Bayesian trust score — fake reviews are down-weighted, so it's more
              honest than a plain average ({s.naive_rating}★ naïve vs {s.bayesian_rating}★ adjusted).
            </p>
          </div>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Ratings &amp; reviews</h2>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-4xl font-bold text-slate-900">{rating.toFixed(1)}<span className="text-xl text-slate-400">/5</span></p>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{s.n_reviews} ratings</p>
          </div>
          <div className="space-y-2">
            {data.reviews.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {r.rating} <Star className="h-2.5 w-2.5 fill-white" />
                </span>
                <p className="min-w-0 flex-1 text-sm text-slate-600">{r.text}</p>
                {r.p_fake >= 0.5 ? (
                  <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">Likely fake {pct(r.p_fake)}</span>
                ) : r.verified_purchase ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Related category={p.category} exclude={p.id} />
    </div>
  );
}

function Related({ category, exclude }: { category: string; exclude: number }) {
  const { data } = useQuery(() => api.products(`?category=${category}&sort=trust&limit=6`), [category]);
  const items = (data?.items ?? []).filter((p) => p.id !== exclude).slice(0, 5);
  if (!items.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-slate-900">You may also like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function Perk({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon className="h-4 w-4 text-slate-500" /> {text}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
