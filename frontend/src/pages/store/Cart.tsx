import { CheckCircle2, Minus, Plus, ShieldCheck, ShoppingCart } from "lucide-react";
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
  const [placed, setPlaced] = useState<{ total: number; n: number } | null>(null);

  const mrpTotal = items.reduce((s, i) => s + pricing(i.price, i.id).mrp * i.qty, 0);
  const savings = mrpTotal - subtotal;

  const placeOrder = () => {
    setPlaced({ total: subtotal, n: count });
    clear();
    toast("Order placed", "success");
  };

  if (placed)
    return (
      <div className="mx-auto max-w-[1100px] px-2 py-3 md:px-3">
        <div className="bg-white px-6 py-16 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-fk-green" />
          <h1 className="mt-4 text-2xl font-semibold text-fk-ink">Order placed</h1>
          <p className="mt-2 text-fk-muted">
            {placed.n} item{placed.n > 1 ? "s" : ""} · {fmtInr(placed.total)} · Delivery in 3–5 days (demo order)
          </p>
          <Link to="/shop" className="mt-6 inline-block rounded-sm bg-fk-blue px-10 py-3 text-sm font-semibold uppercase text-white">
            Continue shopping
          </Link>
        </div>
      </div>
    );

  if (!count)
    return (
      <div className="mx-auto max-w-[1100px] px-2 py-3 md:px-3">
        <div className="bg-white px-6 py-16 text-center">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[#f0f5ff]">
            <ShoppingCart className="h-12 w-12 text-fk-blue" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-fk-ink">Your cart is empty!</h1>
          <p className="mt-1 text-sm text-fk-muted">Add items to it now.</p>
          <Link to="/shop" className="mt-5 inline-block rounded-sm bg-fk-blue px-14 py-3 text-sm font-semibold text-white">
            Shop now
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-[1100px] gap-3 px-2 py-3 md:px-3 lg:grid-cols-[1fr_360px]">
      {/* items */}
      <section className="self-start bg-white">
        <h1 className="border-b border-fk-line px-6 py-4 text-lg font-semibold text-fk-ink">My Cart ({count})</h1>
        {items.map((i) => {
          const { mrp, discount } = pricing(i.price, i.id);
          return (
            <div key={i.id} className="flex gap-5 border-b border-fk-line px-6 py-5">
              <div className="w-28 shrink-0">
                <Link to={`/product/${i.id}`} className="block aspect-square">
                  <ProductImage src={i.image} category={i.category} name={i.name} className="h-full w-full" />
                </Link>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button onClick={() => setQty(i.id, i.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-fk-line text-fk-ink hover:bg-fk-bg" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="grid h-7 w-11 place-items-center border border-fk-line text-sm font-semibold">{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-fk-line text-fk-ink hover:bg-fk-bg" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${i.id}`} className="line-clamp-2 text-base text-fk-ink hover:text-fk-blue">{i.name}</Link>
                <p className="mt-1 text-sm text-fk-muted">{i.category}</p>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-fk-muted line-through">{fmtInr(mrp)}</span>
                  <span className="text-lg font-semibold text-fk-ink">{fmtInr(i.price)}</span>
                  <span className="text-sm font-semibold text-fk-green">{discount}% Off</span>
                </div>
                <button onClick={() => remove(i.id)} className="mt-4 text-sm font-semibold uppercase text-fk-ink hover:text-fk-blue">Remove</button>
              </div>
              <p className="hidden shrink-0 text-sm text-fk-ink sm:block">Delivery in 3–5 days | <span className="text-fk-green">Free</span></p>
            </div>
          );
        })}
        <div className="sticky bottom-0 flex justify-end bg-white px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <button onClick={placeOrder} className="rounded-sm bg-fk-buy px-14 py-3.5 text-base font-semibold uppercase text-white shadow-sm hover:brightness-95">
            Place order
          </button>
        </div>
      </section>

      {/* price details */}
      <aside className="self-start lg:sticky lg:top-[72px]">
        <div className="bg-white">
          <h2 className="border-b border-fk-line px-6 py-3.5 text-sm font-semibold uppercase text-fk-muted">Price details</h2>
          <dl className="space-y-4 px-6 py-5 text-base">
            <Row label={`Price (${count} item${count > 1 ? "s" : ""})`} value={fmtInr(mrpTotal)} />
            <Row label="Discount" value={`− ${fmtInr(savings)}`} tone="text-fk-green" />
            <Row label="Delivery Charges" value={<><span className="mr-1 text-fk-muted line-through">₹40</span><span className="text-fk-green">Free</span></>} />
            <div className="flex justify-between border-y border-dashed border-fk-line py-4 text-lg font-semibold">
              <dt>Total Amount</dt>
              <dd>{fmtInr(subtotal)}</dd>
            </div>
            <p className="text-base font-semibold text-fk-green">You will save {fmtInr(savings)} on this order</p>
          </dl>
        </div>
        <p className="mt-3 flex items-center gap-2 px-2 text-sm font-semibold text-fk-muted">
          <ShieldCheck className="h-6 w-6" /> Safe and secure payments. Only TrustLens-scored sellers.
        </p>
      </aside>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fk-ink">{label}</dt>
      <dd className={tone ?? "text-fk-ink"}>{value}</dd>
    </div>
  );
}
