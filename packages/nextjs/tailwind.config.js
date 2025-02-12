/** @type {import('tailwindcss').Config} */
import { fontFamily as _fontFamily } from "tailwindcss/defaultTheme";

export const content = [
  "./app/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./utils/**/*.{js,ts,jsx,tsx}",
];
export const plugins = [require("daisyui")];
export const darkTheme = "dark";
export const darkMode = ["selector", "[data-theme='dark']"];
export const daisyui = {
  themes: [
    {
      // Light theme: using a light background with accents from your palette.
      light: {
        primary: "#5765F4", // Your blue accent
        "primary-content": "#ffffff", // White text on primary
        secondary: "#444444", // Dark grey for secondary elements
        "secondary-content": "#ffffff",
        accent: "#5765F4",
        "accent-content": "#ffffff",
        neutral: "#f5f5f5", // Light neutral background
        "neutral-content": "#333333", // Dark text for neutrality
        "base-100": "#ffffff", // Main background: white
        "base-200": "#f7f7f7", // Slightly off-white
        "base-300": "#f0f0f0", // Light grey
        "base-content": "#333333", // Primary text color on base backgrounds
        info: "#5765F4",
        success: "#34EEB6", // Standard success green
        warning: "#FFCF72", // Standard warning yellow
        error: "#FF8863", // Standard error red
        "--rounded-btn": "9999rem",
        ".tooltip": { "--tooltip-tail": "6px" },
        ".link": { textUnderlineOffset: "2px" },
        ".link:hover": { opacity: "80%" },
      },
    },
    {
      // Dark theme: using darker backgrounds from your palette.
      dark: {
        primary: "#5765F4", // Blue accent remains
        "primary-content": "#ffffff",
        secondary: "#444444", // Dark grey for secondary elements
        "secondary-content": "#ffffff",
        accent: "#5765F4",
        "accent-content": "#ffffff",
        neutral: "#242424", // Deep dark neutral background
        "neutral-content": "#ffffff",
        "base-100": "#333333", // Mid-tone dark background
        "base-200": "#444444", // Darker grey
        "base-300": "#242424", // Very dark background
        "base-content": "#ffffff",
        info: "#5765F4",
        success: "#34EEB6",
        warning: "#FFCF72",
        error: "#FF8863",
        "--rounded-btn": "9999rem",
        ".tooltip": {
          "--tooltip-tail": "6px",
          "--tooltip-color": "oklch(var(--p))",
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
    },
  },
};
