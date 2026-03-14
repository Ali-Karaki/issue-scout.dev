import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      transitionDuration: {
        smooth: "200ms",
        moderate: "300ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth-out": "cubic-bezier(0, 0, 0.2, 1)",
      },
      colors: {
        bg: "#0d0d0f",
        surface: "#161618",
        "surface-hover": "#1c1c1f",
        border: "#2a2a2e",
        accent: "#f59e0b",
        "accent-dim": "#b45309",
      },
    },
  },
  plugins: [],
};

export default config;
