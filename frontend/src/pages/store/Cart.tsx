import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "@/components/ProductImage";
import { useToast } from "@/components/toast";
import { useCart } from "@/store/cart";
import { fmtInr } from "@/lib/utils";
import { pricing } from "@/lib/shop";

export function Cart() {
  const { items, subtotal, setQty, remove, clear, count } = useCart();
  const toast = useToast();
  const [placed, setPlaced] = useState(false);

  const mrpTotal = items.reduce((s, i) => s + pricing(i.price, i.id).mrp * i.qty, 0);
  const savings = mrpTotal - subtotal;

  const placeOrder = () => {
    setPlaced(true);
    clear();
    toast("Order placed successfully!", "success");
  };

  if (placed)
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Order placed!</h1>
        <p className="mt-2 text-slate-500">Thanks for shopping with TrustLens. Your order is confirmed (demo).</p>
        <Link to="/shop" className="mt-6 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">Continue shopping</Link>
      </div>
    );

  if (!count)
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100">
          <ShoppingBag className="h-9 w-9 text-slate-400" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Browse 300 trust-scored products and add your favourites.</p>
        <Link to="/shop" className="mt-6 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">Start shopping</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Your cart ({count})</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* items */}
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-3">
              <Link to={`/product/${i.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductImage category={i.category} id={i.id} name={i.name} size={200} className="h-full w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/product/${i.id}`} className="line-clamp-1 font-medium text-slate-800 hover:text-slate-900">{i.name}</Link>
                <p className="text-xs text-slate-400">{i.category}</p>
                <p className="mt-1 font-bold text-slate-900">{fmtInr(i.price)}</p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button onClick={() => setQty(i.id, i.qty - 1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{i.qty}</span>
                    <button onClick={() => setQty(i.id, i.qty + 1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => remove(i.id)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-bold text-slate-900">{fmtInr(i.price * i.qty)}</p>
            </div>
          ))}
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Order summary</h2>
            <dl className="space-y-2.5 text-sm">
              <Line label={`Subtotal (${count} items)`} value={fmtInr(mrpTotal)} />
              <Line label="Discount" value={`− ${fmtInr(savings)}`} tone="text-emerald-600" />
              <Line label="Delivery" value="FREE" tone="text-emerald-600" />
              <div className="my-2 border-t border-slate-100" />
              <div className="flex justify-between text-base font-bold text-slate-900">
                <span>Total</span><span>{fmtInr(subtotal)}</span>
              </div>
            </dl>
            <button onClick={placeOrder} className="mt-5 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-700">
              Place order
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">You save {fmtInr(savings)} on this order</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={tone ?? "text-slate-700"}>{value}</dd>
    </div>
  );
}
