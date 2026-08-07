import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        panel: "#121826",
        panel2: "#1a2233",
        border: "#243044",
        accent: "#22c55e",
        danger: "#ef4444",
        muted: "#8b96a8",
      },
    },
  },
  plugins: [],
};
export default config;
