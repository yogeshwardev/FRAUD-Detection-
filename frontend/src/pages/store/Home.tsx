import { ChevronLeft, ChevronRight, Clock, MessageSquareWarning, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DealTile } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Skeleton } from "@/components/ui";
import { api, type ProductListItem } from "@/lib/api";
import { useQuery } from "@/lib/hooks";
import { CATEGORIES, pricing } from "@/lib/shop";
import { fmtInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  sub: string;
  cta: string;
  to: string;
  bg: string;
  product?: ProductListItem;
}

export function StoreHome() {
  const { data, loading } = useQuery(() => api.products("?sort=trust&distinct=true&limit=500"), []);
  const items = data?.items ?? [];
  const inCat = (c: string) => items.filter((p) => p.category === c);
  const deals = [...items]
    .sort((a, b) => pricing(b.price, b.id).discount - pricing(a.price, a.id).discount)
    .slice(0, 6);
  const cheapest = (c: string) => Math.min(...inCat(c).map((p) => p.price));

  const slides: Slide[] = items.length
    ? [
        { title: "Top smartphones and laptops", sub: `From ${fmtInr(cheapest("Electronics"))}`, cta: "Shop electronics", to: "/shop?category=Electronics", bg: "#2874f0", product: inCat("Electronics")[0] },
        { title: "Fashion for every day", sub: "Min. 40% off on top brands", cta: "Shop fashion", to: "/shop?category=Fashion", bg: "#c2185b", product: inCat("Fashion")[0] },
        { title: "Buy only from trusted sellers", sub: "Every seller is scored by TrustLens", cta: "Explore products", to: "/shop", bg: "#00897b", product: inCat("Beauty")[0] },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1280px] space-y-3 px-2 py-3 md:px-3">
      {loading ? <Skeleton className="h-56 rounded-none" /> : <Banner slides={slides} />}

      <Row
        title="Deals of the Day"
        to="/shop"
        extra={<Countdown />}
        products={deals}
        loading={loading}
      />

      {/* why TrustLens */}
      <section className="grid gap-4 bg-white p-5 sm:grid-cols-3">
        <Why icon={ShieldCheck} title="TrustAssured sellers" desc="Bayesian trust score with a confidence level on every seller." />
        <Why icon={MessageSquareWarning} title="Fake reviews flagged" desc="Each review carries a probability of being fake." />
        <Why icon={RotateCcw} title="Return-risk aware" desc="See how likely an order is to be returned before you buy." />
      </section>

      {CATEGORIES.map((c) => (
        <Row key={c} title={`Best of ${c}`} to={`/shop?category=${c}`} products={inCat(c).slice(0, 6)} loading={loading} />
      ))}
    </div>
  );
}

function Banner({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const s = slides[i];
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden" style={{ background: s.bg }}>
      <div className="grid h-56 grid-cols-[1fr_auto] items-center gap-4 px-10 md:h-64 md:px-20">
        <div className="text-white">
          <h1 className="text-2xl font-bold leading-tight text-white md:text-4xl">{s.title}</h1>
          <p className="mt-2 text-base text-white/90 md:text-lg">{s.sub}</p>
          <Link to={s.to} className="mt-5 inline-block rounded-sm bg-white px-6 py-2.5 text-sm font-semibold" style={{ color: s.bg }}>
            {s.cta}
          </Link>
        </div>
        {s.product && (
          <div className="hidden h-44 w-44 overflow-hidden rounded-full bg-white p-3 sm:block md:h-52 md:w-52">
            <ProductImage key={s.product.id} src={s.product.image} category={s.product.category} name={s.product.name} className="h-full w-full rounded-full" eager />
          </div>
        )}
      </div>
      <button onClick={() => go(-1)} className="absolute left-0 top-1/2 grid h-24 w-10 -translate-y-1/2 place-items-center rounded-r bg-white/90 text-fk-ink shadow" aria-label="Previous">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => go(1)} className="absolute right-0 top-1/2 grid h-24 w-10 -translate-y-1/2 place-items-center rounded-l bg-white/90 text-fk-ink shadow" aria-label="Next">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, k) => (
          <button key={k} onClick={() => setI(k)} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-white" : "w-1.5 bg-white/50")} aria-label={`Slide ${k + 1}`} />
        ))}
      </div>
    </section>
  );
}

function Countdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="flex items-center gap-1.5 text-sm text-fk-muted">
      <Clock className="h-4 w-4" />
      {pad(Math.floor(left / 3600))} : {pad(Math.floor((left % 3600) / 60))} : {pad(left % 60)} Left
    </span>
  );
}

function Row({
  title, to, products, loading, extra,
}: { title: string; to: string; products: ProductListItem[]; loading: boolean; extra?: React.ReactNode }) {
  return (
    <section className="bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-fk-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <h2 className="text-xl font-semibold text-fk-ink">{title}</h2>
          {extra}
        </div>
        <Link to={to} className="shrink-0 rounded-sm bg-fk-blue px-4 py-2 text-xs font-semibold uppercase text-white shadow-sm hover:bg-fk-deep">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="m-3 aspect-square rounded-none" />)
          : products.map((p) => <DealTile key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function Why({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f0f5ff] text-fk-blue">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-fk-ink">{title}</p>
        <p className="text-sm text-fk-muted">{desc}</p>
      </div>
    </div>
  );
}
