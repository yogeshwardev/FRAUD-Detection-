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
        // corporate accent — indigo primary, blue secondary
        accent: {
          violet: "#4f46e5", // indigo-600 (primary)
          cyan: "#2563eb", // blue-600 (secondary)
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        risk: {
          low: "#16a34a",
          med: "#d97706",
          high: "#dc2626",
        },
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg,#4f46e5 0%,#2563eb 100%)",
        "accent-soft": "linear-gradient(135deg,rgba(79,70,229,0.12),rgba(37,99,235,0.12))",
      },
      boxShadow: {
        glow: "0 8px 20px rgba(79,70,229,0.22)",
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
