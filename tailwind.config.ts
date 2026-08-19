import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        asphalt: { DEFAULT: "#0c0d10", 2: "#131519", 3: "#191c22" },
        panel: "#1a1d24",
        line: "rgba(237,235,228,0.08)",
        "line-strong": "rgba(237,235,228,0.14)",
        amber: { DEFAULT: "#f5b700", light: "#ffc61a" },
        green: { DEFAULT: "#2fd699", light: "#4fe3ac" },
        red: { DEFAULT: "#ff5470" },
        blue: { DEFAULT: "#4fb6ff" },
        violet: { DEFAULT: "#9b7bff" },
        fog: "#f1efe9",
        mist: { DEFAULT: "#9297a3", dim: "#666b76" },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        heading: ["var(--font-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex)", "monospace"],
      },
      boxShadow: {
        panel: "0 30px 60px -30px rgba(0,0,0,0.65)",
        glow: "0 0 0 3px rgba(245,183,0,0.18)",
      },
      keyframes: {
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".25" } },
        incidentPulse: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(255,84,112,.55)" },
          "50%": { boxShadow: "0 0 0 7px rgba(255,84,112,0)" },
        },
        floatSlow: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse2: "pulse2 1.6s infinite",
        incidentPulse: "incidentPulse .9s infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        fadeUp: "fadeUp .4s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
