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
        // accent — marketplace blue (shared by store and dashboard)
        accent: {
          violet: "#2874f0", // primary blue
          cyan: "#1e5bc6", // deeper blue
        },
        // classic marketplace palette (storefront)
        fk: {
          blue: "#2874f0",
          deep: "#1e5bc6",
          yellow: "#ffe11b",
          orange: "#ff9f00",
          buy: "#fb641b",
          green: "#388e3c",
          bg: "#f1f3f6",
          ink: "#212121",
          muted: "#878787",
          line: "#e0e0e0",
          navy: "#172337",
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
        "accent-gradient": "linear-gradient(135deg,#2874f0 0%,#1e5bc6 100%)",
        "accent-soft": "linear-gradient(135deg,rgba(40,116,240,0.10),rgba(30,91,198,0.10))",
      },
      boxShadow: {
        glow: "0 6px 16px rgba(40,116,240,0.25)",
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
