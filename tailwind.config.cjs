const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "460px",
      btwnMdAndLg: "850px",
      btwnXlAnd2xl: "1400px",
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        obsidian: {
          900: "#07090E",
          800: "#0B0E14",
          700: "#121722",
          600: "#1A202C",
        },
        gold: {
          light: "#FDF0A6",
          DEFAULT: "#D4AF37",
          dark: "#AA820A",
          accent: "#F59E0B",
        },
        neon: {
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
        },
        primary: "#D4AF37",
        secondary: {
          DEFAULT: "#CBD5E1",
          opacity: "#0B0E14",
          15: "rgba(212, 175, 55, 0.15)",
        },
        tertiary: "#07090E",
        inputFieldColor: "rgba(255, 255, 255, 0.04)",
      },
      gridTemplateColumns: {
        contactSection: "1fr 2fr",
        mockrbiSidebar: "20% 80%",
        heroSplit: "1.1fr 1fr",
      },
      fontFamily: {
        sans: ["Inter", "Space Grotesk", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", "Space Mono", "monospace"],
        Lato: ["Inter", "sans-serif"],
        Bebas: ["Space Grotesk", "sans-serif"],
        Abel: ["Inter", "sans-serif"],
      },
      animation: {
        moveShapes: "moveShapes 10s linear infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        marquee: "marquee 25s linear infinite",
        float: "float 6s ease-in-out infinite",
        spinSlow: "spin 20s linear infinite",
        slowPan: "slowPan 40s ease-in-out infinite alternate",
        lightFlicker: "lightFlicker 6s ease-in-out infinite",
        lightFlickerAlt: "lightFlicker 8.5s ease-in-out infinite 2.5s",
      },
      keyframes: {
        moveShapes: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(100vw, 100vh, 0)" },
        },
        shimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))" },
          "50%": { opacity: "0.9", filter: "drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slowPan: {
          "0%": { transform: "scale(1) translate3d(0, 0, 0)" },
          "50%": { transform: "scale(1.06) translate3d(-1.5%, -1%, 0)" },
          "100%": { transform: "scale(1.08) translate3d(1%, 1.5%, 0)" },
        },
        // Uneven stops so the floodlights flicker like a real stadium, not a shine.
        lightFlicker: {
          "0%, 100%": { opacity: "0.35" },
          "8%": { opacity: "0.62" },
          "16%": { opacity: "0.4" },
          "27%": { opacity: "0.7" },
          "38%": { opacity: "0.45" },
          "52%": { opacity: "0.66" },
          "64%": { opacity: "0.38" },
          "78%": { opacity: "0.6" },
          "89%": { opacity: "0.42" },
        },
      },
      boxShadow: {
        hovershadow: "0 0 25px rgba(245, 158, 11, 0.35)",
        goldGlow: "0 0 30px rgba(212, 175, 55, 0.25)",
        glassGlow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      },
      backdropBlur: {
        super: "20px",
      },
    },
  },
  plugins: [],
};
