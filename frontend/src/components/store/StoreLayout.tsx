import { BarChart3, Menu, Search, ShieldCheck, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "@/store/cart";
import { CATEGORIES } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function StoreLayout() {
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(`/shop?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <button className="md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">TrustLens</span>
          </Link>

          <form onSubmit={submit} className="hidden flex-1 md:block">
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:flex"
            >
              <BarChart3 className="h-4 w-4" /> Risk Analytics
            </Link>
            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* category nav */}
        <nav className="border-t border-slate-100 bg-white">
          <div className="mx-auto hidden max-w-7xl items-center gap-1 px-4 md:flex md:px-6">
            <CatLink to="/shop">All</CatLink>
            {CATEGORIES.map((c) => (
              <CatLink key={c} to={`/shop?category=${c}`}>{c}</CatLink>
            ))}
          </div>
        </nav>

        {/* mobile search + menu */}
        {menu && (
          <div className="border-t border-slate-100 p-4 md:hidden">
            <form onSubmit={submit} className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full bg-transparent text-sm outline-none" />
            </form>
            <div className="flex flex-wrap gap-2">
              <CatLink to="/shop" onClick={() => setMenu(false)}>All</CatLink>
              {CATEGORIES.map((c) => (
                <CatLink key={c} to={`/shop?category=${c}`} onClick={() => setMenu(false)}>{c}</CatLink>
              ))}
              <Link to="/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-slate-600">Risk Analytics</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">TrustLens</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              A smart storefront where every product is scored for trust, fake reviews and return
              risk using probabilistic machine learning.
            </p>
          </div>
          <FooterCol title="Shop" links={[["All products", "/shop"], ["Fashion", "/shop?category=Fashion"], ["Electronics", "/shop?category=Electronics"], ["Beauty", "/shop?category=Beauty"]]} />
          <FooterCol title="Intelligence" links={[["Risk Analytics", "/dashboard"], ["Model Performance", "/models"], ["How it works", "/about"], ["About the project", "/project"]]} />
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">Final Year Project</p>
            <p className="text-sm text-slate-500">Intelligent Consumer Trust &amp; Product Risk Assessment Using Probabilistic Machine Learning.</p>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Jyoshna. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function CatLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "rounded-lg px-3 py-2.5 text-sm font-medium transition",
          isActive ? "text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-slate-500 hover:text-slate-900">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
