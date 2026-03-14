import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
