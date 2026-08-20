import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090e",
        foreground: "#f1f5f9",
        surface: {
          50: "#1e293b",
          100: "#141c28",
          200: "#0e141f",
          300: "#090d15",
          400: "#05080d",
        },
        accent: {
          blue: "#6389ff",
          violet: "#8b7cf6",
          indigo: "#4f6adb",
          sky: "#38bdf8",
        },
        lunar: {
          cyan: "#22d3ee",
          glow: "#06b6d4",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
          purple: "#8b5cf6",
          silver: "#94a3b8"
        },
        trust: {
          high: "#34d399",
          moderate: "#fbbf24",
          low: "#f87171",
        }
      },
      fontFamily: {
        sans: ["Satoshi", "Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
};

export default config;
