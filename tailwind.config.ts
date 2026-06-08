import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a1a",
          deep: "#141414",
          raised: "#1f1f1f",
          panel: "#1c1c1c",
        },
        red: {
          DEFAULT: "#D7172A",
          alt: "#C8102E",
          deep: "#a50d24",
        },
        cream: {
          light: "#fbf8f3",
          base: "#f7f3ec",
          deep: "#ede7da",
        },
        slate: {
          shared: "#6b7280",
          sharedLight: "#9aa1ad",
        },
        line: "rgba(255,255,255,0.08)",
        line2: "rgba(255,255,255,0.14)",
        dim: "#8d897f",
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "system-ui", "sans-serif"],
        mono: ['"SF Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(.2,.7,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
