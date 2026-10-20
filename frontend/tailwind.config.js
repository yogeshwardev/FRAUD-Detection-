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
        bg: {
          DEFAULT: "#0B0F19",
          soft: "#0F1424",
        },
        glass: "rgba(255,255,255,0.04)",
        accent: {
          violet: "#8B5CF6",
          cyan: "#22D3EE",
        },
        risk: {
          low: "#34D399",
          med: "#FBBF24",
          high: "#FB7185",
        },
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg,#8B5CF6 0%,#22D3EE 100%)",
        "accent-soft": "linear-gradient(135deg,rgba(139,92,246,0.18),rgba(34,211,238,0.18))",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.30)",
        glow: "0 0 24px rgba(139,92,246,0.25)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
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
