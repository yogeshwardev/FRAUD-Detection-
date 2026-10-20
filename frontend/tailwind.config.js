/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // canvas / surfaces (dark values; light handled in CSS)
        bg: {
          DEFAULT: "#0B1120",
          soft: "#111a2e",
        },
        // corporate accent — deep slate / graphite
        accent: {
          violet: "#0f172a", // slate-900 (primary)
          cyan: "#334155", // slate-700 (secondary)
        },
        brand: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          500: "#334155",
          600: "#0f172a",
          700: "#020617",
        },
        risk: {
          low: "#16a34a",
          med: "#d97706",
          high: "#dc2626",
        },
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
        "accent-soft": "linear-gradient(135deg,rgba(15,23,42,0.08),rgba(51,65,85,0.08))",
      },
      boxShadow: {
        glow: "0 8px 20px rgba(15,23,42,0.18)",
        glass: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
        card: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
      },
      borderRadius: {
        "2xl": "0.9rem",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        float: "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
