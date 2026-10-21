import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useTheme } from "./components/theme";
import { Layout } from "./components/Layout";
import { StoreLayout } from "./components/store/StoreLayout";
import { StoreHome } from "./pages/store/Home";
import { Catalog } from "./pages/store/Catalog";
import { StoreProduct } from "./pages/store/Product";
import { Cart } from "./pages/store/Cart";
import { Overview } from "./pages/Overview";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { ReturnPredictor } from "./pages/ReturnPredictor";
import { Fraud } from "./pages/Fraud";
import { FraudDetail } from "./pages/FraudDetail";
import { ReviewChecker } from "./pages/ReviewChecker";
import { ModelPerformance } from "./pages/ModelPerformance";
import { About } from "./pages/About";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ThemeRouteSync() {
  const { theme } = useTheme();
  const loc = useLocation();
  useEffect(() => {
    const p = loc.pathname;
    const isStore = p === "/" || p.startsWith("/shop") || p.startsWith("/product") || p.startsWith("/cart");
    document.documentElement.classList.toggle("dark", !isStore && theme === "dark");
  }, [theme, loc.pathname]);
  return null;
}

export default function App() {
  const loc = useLocation();
  return (
    <>
      <ThemeRouteSync />
      <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        {/* Storefront */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<StoreHome />} />
          <Route path="/shop" element={<Catalog />} />
          <Route path="/product/:id" element={<StoreProduct />} />
          <Route path="/cart" element={<Cart />} />
        </Route>

        {/* Risk analytics (admin) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Page><Overview /></Page>} />
          <Route path="/products" element={<Page><Products /></Page>} />
          <Route path="/products/:id" element={<Page><ProductDetail /></Page>} />
          <Route path="/returns" element={<Page><ReturnPredictor /></Page>} />
          <Route path="/fraud" element={<Page><Fraud /></Page>} />
          <Route path="/fraud/:id" element={<Page><FraudDetail /></Page>} />
          <Route path="/reviews" element={<Page><ReviewChecker /></Page>} />
          <Route path="/models" element={<Page><ModelPerformance /></Page>} />
          <Route path="/about" element={<Page><About /></Page>} />
        </Route>
      </Routes>
      </AnimatePresence>
    </>
  );
}
