import {
  BarChart3, Dumbbell, Footprints, LayoutGrid, Search, ShieldCheck, ShoppingCart, Shirt,
  Smartphone, Sofa, Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

const CATEGORY_NAV = [
  { name: "All", icon: LayoutGrid, to: "/shop" },
  { name: "Electronics", icon: Smartphone, to: "/shop?category=Electronics" },
  { name: "Fashion", icon: Shirt, to: "/shop?category=Fashion" },
  { name: "Footwear", icon: Footprints, to: "/shop?category=Footwear" },
  { name: "Home", icon: Sofa, to: "/shop?category=Home" },
  { name: "Beauty", icon: Sparkles, to: "/shop?category=Beauty" },
  { name: "Sports", icon: Dumbbell, to: "/shop?category=Sports" },
];

export function StoreLayout() {
  const { count } = useCart();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("search") ?? "");
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => setQ(params.get("search") ?? ""), [params]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : "/shop");
  };

  return (
    <div className="flex min-h-screen flex-col bg-fk-bg text-fk-ink">
      {/* blue header */}
      <header className="sticky top-0 z-40 bg-fk-blue shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-3 md:gap-6 md:px-6">
          <Link to="/" className="shrink-0 leading-none">
            <span className="block text-xl font-bold italic tracking-tight text-white">TrustLens</span>
            <span className="flex items-center gap-1 text-[11px] italic text-white/90">
              Shop with <span className="font-semibold text-fk-yellow">Trust</span>
              <ShieldCheck className="h-3 w-3 text-fk-yellow" />
            </span>
          </Link>

          <form onSubmit={submit} className="flex min-w-0 max-w-[560px] flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, brands and more"
              className="h-9 min-w-0 flex-1 rounded-l-sm bg-white px-4 text-sm text-fk-ink outline-none placeholder:text-fk-muted"
            />
            <button type="submit" className="grid h-9 w-11 place-items-center rounded-r-sm bg-white text-fk-blue" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
          </form>

          <Link
            to="/dashboard"
            className="hidden shrink-0 items-center gap-1.5 rounded-sm bg-white px-5 py-1.5 text-sm font-semibold text-fk-blue md:flex"
          >
            <BarChart3 className="h-4 w-4" /> Risk Analytics
          </Link>
          <Link to="/cart" className="relative flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full border border-white bg-[#ff6161] px-1 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </header>

      {/* category strip */}
      <nav className="bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-[1280px] justify-between gap-2 overflow-x-auto px-3 py-2 md:justify-around md:px-6">
          {CATEGORY_NAV.map((c) => (
            <CategoryLink key={c.name} {...c} current={loc.pathname === "/shop" && (params.get("category") ?? "All") === c.name} />
          ))}
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* footer */}
      <footer className="mt-6 bg-fk-navy text-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 sm:grid-cols-2 md:grid-cols-4">
          <FooterCol title="Shop" links={[["All products", "/shop"], ["Electronics", "/shop?category=Electronics"], ["Fashion", "/shop?category=Fashion"], ["Beauty", "/shop?category=Beauty"]]} />
          <FooterCol title="Help" links={[["Your cart", "/cart"], ["Fake review checker", "/reviews"], ["Return risk checker", "/returns"]]} />
          <FooterCol title="Intelligence" links={[["Risk analytics", "/dashboard"], ["Model performance", "/models"], ["How it works", "/about"], ["About the project", "/project"]]} />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#878787]">About TrustLens</p>
            <p className="text-xs leading-relaxed text-white/80">
              Every product and seller on this store is scored for trust, fake reviews and return
              risk using probabilistic machine learning.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-white/80 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-fk-yellow" /> TrustLens Assured sellers
            </span>
            <span>© {new Date().getFullYear()} Jyoshna. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CategoryLink({
  name, icon: Icon, to, current,
}: { name: string; icon: React.ElementType; to: string; current: boolean }) {
  return (
    <NavLink to={to} className="group flex min-w-[64px] flex-col items-center gap-1 px-2 py-1">
      <span className={cn(
        "grid h-10 w-10 place-items-center rounded-full transition",
        current ? "bg-fk-blue text-white" : "bg-[#f0f5ff] text-fk-blue group-hover:bg-[#e0ebff]",
      )}>
        <Icon className="h-5 w-5" />
      </span>
      <span className={cn("text-[13px] font-medium", current ? "text-fk-blue" : "text-fk-ink group-hover:text-fk-blue")}>
        {name}
      </span>
    </NavLink>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#878787]">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-xs font-medium text-white hover:underline">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
