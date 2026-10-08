import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#fff8f8",
        plum: {
          900: "#fff1f4",
          800: "#fbe4ea",
          700: "#f4d1db",
          600: "#e8b8c6",
        },
        rose: {
          DEFAULT: "#a60f3c",
          soft: "#c52e5b",
          deep: "#7e0c2e",
        },
        lavender: {
          DEFAULT: "#b95e82",
          deep: "#8d3a61",
        },
        cream: {
          DEFAULT: "#5b1730",
          muted: "#7e5262",
          dim: "#a17b89",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -32px rgba(126,12,46,.28)",
        glow: "0 0 0 1px rgba(166,15,60,.10), 0 24px 60px -30px rgba(166,15,60,.22)",
      },
      borderRadius: { xl2: "1.5rem" },
    },
  },
  plugins: [],
};
export default config;
