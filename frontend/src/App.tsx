import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/" element={<Landing />} />
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
  );
}
