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
        mint:       "#B8F5C8",
        charcoal:   "#111111",
        offwhite:   "#F5F5F3",
        "light-gray": "#E8E8E8",
        "mid-gray":   "#D0D0D0",
        border:       "#D0D0D0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        display:    ["clamp(72px,11vw,160px)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-sm": ["clamp(52px,7.5vw,110px)", { lineHeight: "0.92", letterSpacing: "-0.025em" }],
        "display-xs": ["clamp(36px,4vw,64px)",   { lineHeight: "1",    letterSpacing: "-0.02em"  }],
        stat:       ["clamp(48px,7vw,100px)",  { lineHeight: "1",    letterSpacing: "-0.03em"  }],
      },
    },
  },
  plugins: [],
};
export default config;
