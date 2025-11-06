import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cali: {
          magenta: "#E91E8C",
          purple: "#A855F7",
          pink: "#EC4899",
          black: "#0A0A0A",
          darkPurple: "#1E0B2E",
        },
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "fade-out": "fadeOut 0.5s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
