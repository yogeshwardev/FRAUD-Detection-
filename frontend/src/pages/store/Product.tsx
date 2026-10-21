import { Award, ChevronRight, RotateCcw, ShieldCheck, ShoppingCart, Star, Tag, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssuredBadge, DealTile, RatingChip } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Gauge } from "@/components/Gauge";
import { Skeleton } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCart } from "@/store/cart";
import { api, type Offer, type ReviewItem } from "@/lib/api";
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
  const [sel, setSel] = useState(0);

  useEffect(() => {
    setSel(0);
    window.scrollTo({ top: 0 });
  }, [id]);

  if (loading || !data)
    return (
      <div className="mx-auto grid max-w-[1280px] gap-4 bg-white p-4 md:grid-cols-[5fr_7fr]">
        <Skeleton className="aspect-square rounded-none" />
        <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-40" /></div>
      </div>
    );

  const p = data.product;
  const s = data.scores;
  const gallery = p.gallery.length ? p.gallery : [p.image];
  const rating = starRating(s.trust);
  const { mrp, discount } = pricing(p.price, p.id);
  const assured = s.trust >= 75;

  const addToCart = () => {
    add({ id: p.id, name: p.name, price: p.price, category: p.category, image: p.image });
    toast(`Added “${p.name}” to your cart`, "success");
  };

  return (
    <div className="mx-auto max-w-[1280px] px-2 py-2 md:px-3">
      <div className="grid gap-4 bg-white p-4 md:grid-cols-[5fr_7fr]">
        {/* gallery + buttons */}
        <div className="md:sticky md:top-[72px] md:self-start">
          <div className="flex gap-3">
            {gallery.length > 1 && (
              <div className="flex w-16 shrink-0 flex-col gap-2">
                {gallery.map((g, i) => (
                  <button
                    key={g}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => setSel(i)}
                    className={cn("aspect-square border-2 bg-white", i === sel ? "border-fk-blue" : "border-fk-line")}
                    aria-label={`Image ${i + 1}`}
                  >
                    <ProductImage src={g} category={p.category} name={p.name} className="h-full w-full" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 border border-fk-line">
              <ProductImage key={gallery[sel]} src={gallery[sel]} category={p.category} name={p.name} className="aspect-square w-full" eager />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={addToCart} className="flex h-14 items-center justify-center gap-2 rounded-sm bg-fk-orange text-base font-semibold uppercase text-white shadow-sm hover:brightness-95">
              <ShoppingCart className="h-5 w-5" /> Add to cart
            </button>
            <button onClick={() => { addToCart(); nav("/cart"); }} className="flex h-14 items-center justify-center gap-2 rounded-sm bg-fk-buy text-base font-semibold uppercase text-white shadow-sm hover:brightness-95">
              <Zap className="h-5 w-5 fill-white" /> Buy now
            </button>
          </div>
        </div>

        {/* details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-xs text-fk-muted">
            <Link to="/" className="hover:text-fk-blue">Home</Link><ChevronRight className="h-3 w-3" />
            <Link to={`/shop?category=${p.category}`} className="hover:text-fk-blue">{p.category}</Link><ChevronRight className="h-3 w-3" />
            <span className="truncate">{p.name}</span>
          </div>

          {p.brand !== "Generic" && <p className="mt-2 text-sm font-semibold text-fk-muted">{p.brand}</p>}
          <h1 className="mt-1 text-xl text-fk-ink">{p.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <RatingChip value={rating} className="text-sm" />
            <span className="text-sm font-medium text-fk-muted">{s.n_reviews} Ratings &amp; {data.reviews.length} Reviews</span>
            {assured && <AssuredBadge />}
          </div>

          <p className="mt-3 text-sm font-semibold text-fk-green">Special price</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-fk-ink">{fmtInr(p.price)}</span>
            <span className="text-base text-fk-muted line-through">{fmtInr(mrp)}</span>
            <span className="text-base font-semibold text-fk-green">{discount}% off</span>
          </div>

          <div className="mt-4">
            <p className="font-semibold text-fk-ink">Available offers</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <OfferLine icon={Tag}><b>Special price</b> Get extra {Math.min(discount, 15)}% off (price inclusive of discount)</OfferLine>
              <OfferLine icon={Truck}><b>Free delivery</b> on this order</OfferLine>
              <OfferLine icon={RotateCcw}><b>7 days replacement</b> if the item is damaged or defective</OfferLine>
            </ul>
          </div>

          <div className="mt-5 grid gap-y-3 text-sm sm:grid-cols-[110px_1fr]">
            <span className="text-fk-muted">Seller</span>
            <span>
              <span className="font-semibold text-fk-blue">Seller #{p.seller_id}</span>{" "}
              <RatingChip value={p.seller_rating} className="ml-1 bg-fk-blue" />
              {data.offers.length > 1 && (
                <a href="#sellers" className="ml-3 text-xs font-semibold text-fk-blue">See other sellers</a>
              )}
            </span>
            <span className="text-fk-muted">Description</span>
            <span className="leading-relaxed text-fk-ink">{p.description}</span>
          </div>

          {/* TrustLens assessment */}
          <div className="mt-5 border border-fk-line">
            <div className="flex items-center gap-2 border-b border-fk-line px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-fk-blue" />
              <h2 className="text-base font-semibold text-fk-ink">TrustLens assessment</h2>
              <span className="text-xs text-fk-muted">for this seller</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 p-4">
              <Gauge value={s.trust} low={s.trust_low} high={s.trust_high} size={120} label="/ 100" color={trustHex(s.trust)} />
              <div className="min-w-[200px] flex-1 space-y-2 text-sm">
                <Line label="Confidence" value={s.confidence} />
                <Line label="95% credible interval" value={`${s.trust_low} – ${s.trust_high}`} />
                <Line label="Product risk" value={<span className={tier(s.risk_tier).text}>{s.risk_tier}</span>} />
                <Line label="Likely-fake reviews" value={`${data.reviews.filter((r) => r.p_fake >= 0.5).length} of ${data.reviews.length}`} />
              </div>
            </div>
            <p className="border-t border-fk-line bg-fk-bg px-4 py-2.5 text-xs text-fk-muted">
              Rating shown is the Bayesian trust score: fake reviews are down-weighted ({s.naive_rating}★ plain average vs {s.bayesian_rating}★ adjusted).
            </p>
          </div>

          {data.offers.length > 1 && <Sellers offers={data.offers} />}
          <Reviews reviews={data.reviews} rating={rating} total={s.n_reviews} />
        </div>
      </div>

      <Similar category={p.category} excludeBase={p.base_id} />
    </div>
  );
}

function OfferLine({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-fk-ink">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fk-green" />
      <span>{children}</span>
    </li>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-fk-muted">{label}</span>
      <span className="font-semibold text-fk-ink">{value}</span>
    </div>
  );
}

function Sellers({ offers }: { offers: Offer[] }) {
  const best = offers.reduce((a, b) => (b.trust > a.trust ? b : a));
  return (
    <div id="sellers" className="mt-5 scroll-mt-24 border border-fk-line">
      <div className="border-b border-fk-line px-4 py-3">
        <h2 className="text-base font-semibold text-fk-ink">Sold by {offers.length} sellers</h2>
        <p className="text-xs text-fk-muted">Same product — TrustLens scores each seller separately so you can pick the safest one.</p>
      </div>
      {offers.map((o) => (
        <div key={o.id} className={cn("flex flex-wrap items-center gap-4 border-b border-fk-line px-4 py-3 text-sm last:border-0", o.current && "bg-[#f5faff]")}>
          <div className="min-w-[130px] flex-1">
            <p className="flex items-center gap-2 font-semibold text-fk-ink">
              Seller #{o.seller_id}
              {o.id === best.id && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-[#e7f5e9] px-1.5 py-0.5 text-[11px] font-semibold text-fk-green">
                  <Award className="h-3 w-3" /> Most trusted
                </span>
              )}
            </p>
            <RatingChip value={o.seller_rating} className="mt-1 bg-fk-blue" />
          </div>
          <div className="w-28">
            <p className="text-xs text-fk-muted">Trust score</p>
            <p className="font-semibold" style={{ color: trustHex(o.trust) }}>{o.trust}<span className="text-xs font-normal text-fk-muted"> /100</span></p>
          </div>
          <span className={cn("rounded-sm px-2 py-0.5 text-xs font-semibold", tier(o.risk_tier).bg, tier(o.risk_tier).text)}>{o.risk_tier} risk</span>
          <span className="w-24 text-right text-base font-semibold text-fk-ink">{fmtInr(o.price)}</span>
          {o.current ? (
            <span className="w-24 text-center text-xs font-semibold text-fk-muted">Selected</span>
          ) : (
            <Link to={`/product/${o.id}`} className="w-24 rounded-sm bg-fk-orange py-2 text-center text-xs font-semibold uppercase text-white">
              Choose
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function Reviews({ reviews, rating, total }: { reviews: ReviewItem[]; rating: number; total: number }) {
  const counts = [5, 4, 3, 2, 1].map((r) => reviews.filter((x) => x.rating === r).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="mt-5 border border-fk-line">
      <h2 className="border-b border-fk-line px-4 py-3 text-base font-semibold text-fk-ink">Ratings &amp; Reviews</h2>
      <div className="flex flex-wrap items-center gap-6 px-4 py-4">
        <div className="text-center">
          <p className="flex items-center justify-center gap-1 text-3xl font-semibold text-fk-ink">
            {rating.toFixed(1)} <Star className="h-6 w-6 fill-fk-ink text-fk-ink" />
          </p>
          <p className="mt-1 text-xs text-fk-muted">{total} Ratings &amp;<br />{reviews.length} Reviews</p>
        </div>
        <div className="min-w-[220px] flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((r, i) => (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-fk-ink">{r} ★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fk-bg">
                <div className={cn("h-full rounded-full", r >= 3 ? "bg-fk-green" : r === 2 ? "bg-fk-orange" : "bg-[#ff6161]")} style={{ width: `${(counts[i] / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-fk-muted">{counts[i]}</span>
            </div>
          ))}
        </div>
      </div>
      {reviews.slice(0, 8).map((r) => (
        <div key={r.id} className="border-t border-fk-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-[1px] text-xs font-semibold text-white", r.rating >= 3 ? "bg-fk-green" : r.rating === 2 ? "bg-fk-orange" : "bg-[#ff6161]")}>
              {r.rating} <Star className="h-2.5 w-2.5 fill-white" />
            </span>
            {r.p_fake >= 0.5 && (
              <span className="rounded-sm bg-[#ffeaea] px-1.5 py-0.5 text-[11px] font-semibold text-[#d32f2f]">Likely fake · {pct(r.p_fake)}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-fk-ink">{r.text}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-fk-muted">
            {r.verified_purchase && (
              <span className="inline-flex items-center gap-1 text-fk-muted"><ShieldCheck className="h-3.5 w-3.5" /> Certified buyer</span>
            )}
            <span>{new Date(r.timestamp.replace(" ", "T")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function Similar({ category, excludeBase }: { category: string; excludeBase: number }) {
  const { data } = useQuery(() => api.products(`?category=${category}&sort=trust&distinct=true&limit=8`), [category]);
  const items = (data?.items ?? []).filter((p) => p.base_id !== excludeBase).slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="mt-3 bg-white">
      <h2 className="border-b border-fk-line px-5 py-4 text-xl font-semibold text-fk-ink">Similar products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((p) => <DealTile key={p.id} p={p} />)}
      </div>
    </section>
  );
}
