import { ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductImage } from "@/components/ProductImage";
import type { ProductListItem } from "@/lib/api";
import { fmtInr } from "@/lib/utils";
import { pricing, starRating } from "@/lib/shop";

/** "TrustLens Assured" badge — shown for listings with a high Bayesian trust score. */
export function AssuredBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold italic text-fk-blue ${small ? "text-[11px]" : "text-xs"}`}>
      <ShieldCheck className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      Trust<span className="text-fk-orange">Assured</span>
    </span>
  );
}

export function RatingChip({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-[3px] bg-fk-green px-1.5 py-[1px] text-xs font-semibold text-white ${className}`}>
      {value.toFixed(1)} <Star className="h-2.5 w-2.5 fill-white" />
    </span>
  );
}

/** Grid tile used on the catalogue page. */
export function ProductCard({ p }: { p: ProductListItem }) {
  const rating = starRating(p.trust);
  const { mrp, discount } = pricing(p.price, p.id);

  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex h-full flex-col bg-white p-4 transition hover:z-10 hover:shadow-[0_3px_16px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto aspect-square w-full max-w-[220px]">
        <ProductImage src={p.image} category={p.category} name={p.name} className="h-full w-full" />
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm text-fk-ink group-hover:text-fk-blue">{p.name}</h3>
      <p className="mt-0.5 truncate text-xs text-fk-muted">{p.brand !== "Generic" ? p.brand : p.category}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <RatingChip value={rating} />
        <span className="text-xs font-medium text-fk-muted">({p.n_reviews.toLocaleString("en-IN")})</span>
        {p.trust >= 75 && <AssuredBadge small />}
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-base font-semibold text-fk-ink">{fmtInr(p.price)}</span>
        <span className="text-sm text-fk-muted line-through">{fmtInr(mrp)}</span>
        <span className="text-[13px] font-semibold text-fk-green">{discount}% off</span>
      </div>
      <p className="mt-1 text-xs text-fk-ink">Free delivery</p>
      {(p.offers ?? 1) > 1 && <p className="mt-0.5 text-xs text-fk-muted">{p.offers} sellers from {fmtInr(p.price)}</p>}
    </Link>
  );
}

/** Compact tile for home-page deal rows: photo, name, green offer line. */
export function DealTile({ p }: { p: ProductListItem }) {
  const { discount } = pricing(p.price, p.id);
  return (
    <Link to={`/product/${p.id}`} className="group flex w-full flex-col items-center px-2 py-3 text-center">
      <div className="aspect-square w-full max-w-[150px] transition-transform duration-300 group-hover:scale-105">
        <ProductImage src={p.image} category={p.category} name={p.name} className="h-full w-full" />
      </div>
      <p className="mt-3 line-clamp-1 w-full text-sm font-medium text-fk-ink">{p.name}</p>
      <p className="mt-1 text-sm font-semibold text-fk-green">
        {discount >= 40 ? `Min. ${Math.floor(discount / 10) * 10}% Off` : `Just ${fmtInr(p.price)}`}
      </p>
      <p className="mt-0.5 line-clamp-1 text-xs text-fk-muted">{p.brand !== "Generic" ? p.brand : p.category}</p>
    </Link>
  );
}
