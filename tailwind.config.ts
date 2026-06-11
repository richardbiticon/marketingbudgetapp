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
        // Theme-aware: these resolve to CSS vars defined in globals.css and
        // flip between dark and light via the html class.
        ink: {
          DEFAULT: "var(--bg)",
          deep: "var(--surface-deep)",
          raised: "var(--surface-raised)",
          panel: "var(--surface)",
        },
        red: {
          DEFAULT: "#D7172A",
          alt: "#C8102E",
          deep: "#a50d24",
        },
        cream: {
          light: "var(--fg)",
          base: "var(--fg-2)",
          deep: "var(--cream-deep)",
        },
        slate: {
          shared: "#6b7280",
          sharedLight: "#9aa1ad",
        },
        line: "var(--line)",
        line2: "var(--line2)",
        dim: "var(--muted)",
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
