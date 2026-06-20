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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // PrescriptionNet custom palette
        'pn-bg': '#0f172a',
        'pn-card': '#1e293b',
        'pn-border': '#334155',
        'pn-blue': '#3b82f6',
        'pn-cyan': '#06b6d4',
        'pn-green': '#22c55e',
        'pn-orange': '#f97316',
        'pn-red': '#ef4444',
      },
    },
  },
  plugins: [],
};
export default config;
