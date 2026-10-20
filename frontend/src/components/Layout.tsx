import { motion } from "framer-motion";
import {
  Activity,
  Boxes,
  ChevronLeft,
  LayoutDashboard,
  Menu,
  MessageSquareWarning,
  Moon,
  RotateCcw,
  Search,
  ShieldAlert,
  Sun,
  Workflow,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { useTheme } from "./theme";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/products", label: "Trust & Risk", icon: Boxes },
  { to: "/returns", label: "Return Risk", icon: RotateCcw },
  { to: "/fraud", label: "Fraud Users", icon: ShieldAlert },
  { to: "/reviews", label: "Review Checker", icon: MessageSquareWarning },
  { to: "/models", label: "Model Performance", icon: Activity },
  { to: "/about", label: "How It Works", icon: Workflow },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const loc = useLocation();

  useEffect(() => setMobileOpen(false), [loc.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:bg-bg-soft/70 md:static",
          collapsed ? "w-[76px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-bold tracking-tight">TrustLens</p>
              <p className="text-[10px] text-slate-400">Risk Intelligence</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  isActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-xl bg-accent-soft ring-1 ring-inset ring-accent-violet/30"
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 hidden items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs text-slate-400 hover:bg-white/5 md:flex"
        >
          <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-white/75 px-4 backdrop-blur-xl dark:bg-bg/60 md:px-6">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:bg-white/10 md:max-w-sm"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search products, users, pages…</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] sm:block">Ctrl K</kbd>
          </button>
          <div className="flex-1" />
          <button
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 hover:bg-white/5"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/10 px-4 py-6 md:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
            <p>
              <span className="font-semibold text-slate-400">TrustLens</span> · Intelligent Consumer
              Trust &amp; Product Risk Assessment
            </p>
            <p>Probabilistic Machine Learning · Final Year Project</p>
          </div>
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
