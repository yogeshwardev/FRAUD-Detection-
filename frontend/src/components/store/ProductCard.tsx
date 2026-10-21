import { Plus, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductImage } from "@/components/ProductImage";
import { useToast } from "@/components/toast";
import { useCart } from "@/store/cart";
import type { ProductListItem } from "@/lib/api";
import { fmtInr } from "@/lib/utils";
import { pricing, starRating } from "@/lib/shop";

export function ProductCard({ p }: { p: ProductListItem }) {
  const { add } = useCart();
  const toast = useToast();
  const rating = starRating(p.trust);
  const { mrp, discount } = pricing(p.price, p.id);

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({ id: p.id, name: p.name, price: p.price, category: p.category });
    toast(`Added “${p.name}” to cart`, "success");
  };

  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductImage category={p.category} id={p.id} name={p.name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        {discount >= 30 && (
          <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
        {p.trust >= 75 && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
            <ShieldCheck className="h-3 w-3" /> Trusted
          </span>
        )}
        <button
          onClick={quickAdd}
          className="absolute bottom-2 right-2 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-slate-900 text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 hover:bg-slate-700"
          aria-label="Add to cart"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{p.category}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800">{p.name}</h3>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {rating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-white" />
          </span>
          <span className="text-[11px] text-slate-400">({p.n_reviews})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-slate-900">{fmtInr(p.price)}</span>
          <span className="text-xs text-slate-400 line-through">{fmtInr(mrp)}</span>
          <span className="text-xs font-semibold text-emerald-600">{discount}% off</span>
        </div>
      </div>
    </Link>
  );
}
