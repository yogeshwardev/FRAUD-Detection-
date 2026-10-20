import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CornerDownLeft,
  LayoutDashboard,
  RotateCcw,
  Search,
  ShieldAlert,
  Activity,
  MessageSquareWarning,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ProductListItem, type UserListItem } from "@/lib/api";

const PAGES = [
  { label: "Overview Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Product Trust & Risk", to: "/products", icon: Boxes },
  { label: "Return Risk Predictor", to: "/returns", icon: RotateCcw },
  { label: "Fraud User Detection", to: "/fraud", icon: ShieldAlert },
  { label: "Fake Review Checker", to: "/reviews", icon: MessageSquareWarning },
  { label: "Model Performance", to: "/models", icon: Activity },
  { label: "How It Works", to: "/about", icon: Workflow },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setProducts([]);
      setUsers([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setProducts([]);
      setUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const [p, u] = await Promise.all([
          api.products(`?search=${encodeURIComponent(q)}&limit=4`),
          api.users(`?search=${encodeURIComponent(q)}&limit=4`),
        ]);
        setProducts(p.items);
        setUsers(u.items);
      } catch {
        /* ignore */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const pages = useMemo(
    () => PAGES.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const go = (to: string) => {
    nav(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass w-[92vw] max-w-xl overflow-hidden p-0"
            initial={{ scale: 0.96, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search pages, products, users…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                onKeyDown={(e) => e.key === "Escape" && onClose()}
              />
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">ESC</kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              <Group label="Pages">
                {pages.map((p) => (
                  <Row key={p.to} onClick={() => go(p.to)} icon={<p.icon className="h-4 w-4" />}>
                    {p.label}
                  </Row>
                ))}
              </Group>
              {products.length > 0 && (
                <Group label="Products">
                  {products.map((p) => (
                    <Row
                      key={p.id}
                      onClick={() => go(`/products/${p.id}`)}
                      icon={<Boxes className="h-4 w-4" />}
                      hint={`Trust ${p.trust} · ${p.risk_tier} risk`}
                    >
                      {p.name}
                    </Row>
                  ))}
                </Group>
              )}
              {users.length > 0 && (
                <Group label="Users">
                  {users.map((u) => (
                    <Row
                      key={u.id}
                      onClick={() => go(`/fraud/${u.id}`)}
                      icon={<ShieldAlert className="h-4 w-4" />}
                      hint={`Fraud ${(u.fraud_prob * 100).toFixed(0)}% · ${u.tier}`}
                    >
                      {u.name}
                    </Row>
                  ))}
                </Group>
              )}
              {!pages.length && !products.length && !users.length && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No matches.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  children,
  icon,
  hint,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
    >
      <span className="text-slate-500 group-hover:text-accent-cyan">{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
      <CornerDownLeft className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100" />
    </button>
  );
}
