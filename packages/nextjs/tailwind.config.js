/** @type {import('tailwindcss').Config} */
import { fontFamily as _fontFamily } from "tailwindcss/defaultTheme";

export const content = [
  "./app/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./utils/**/*.{js,ts,jsx,tsx}",
];

export const plugins = [require("daisyui")];

export const daisyui = {
  themes: [
    {
      impostors: {
        primary: "#ddb340", // Yellow-gold
        "primary-content": "#eae2d1", // Off-white text
        secondary: "#369475", // Green accent
        "secondary-content": "#ffffff",
        accent: "#26479a", // Pixel-style blue
        "accent-content": "#ffffff",
        neutral: "#0a1219", // Dark pixel bg
        "neutral-content": "#eae2d1", // Text color on neutral bg
        "base-100": "#0a1219", // Overall page bg
        "base-200": "#101820",
        "base-300": "#1a1a1a",
        "base-content": "#eae2d1",
        info: "#5765F4",
        success: "#34EEB6",
        warning: "#FFCF72",
        error: "#FF8863",
        "--rounded-btn": "0.375rem",
        ".tooltip": {
          "--tooltip-tail": "6px",
        },
        ".link": { textUnderlineOffset: "2px" },
        ".link:hover": { opacity: "80%" },
      },
    },
  ],
};

export const theme = {
  extend: {
    boxShadow: {
      center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
    },
    animation: {
      "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    },
    fontFamily: {
      sans: ['"Lexend Deca"', ..._fontFamily.sans],
      pixel: ['"Pixelify Sans"', "monospace"],
    },
    colors: {
      pixelGold: {
        light: "#FFD700",
        DEFAULT: "#DAA520",
        dark: "#B8860B",
        darker: "#8B6914",
      },
      pixelBlue: {
        dark: "#0A1929",
        DEFAULT: "#1A2B3C",
        light: "#2A3B4C",
        darker: "#0A1219",
      },
    },
  },
};
