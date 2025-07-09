import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Same.dev color palette
        aiAgent: {
          bg: "#ffffff",
          text: "#1a1a1a",
        },
        user: {
          bg: "#1f1f1f",
          text: "#ffffff",
        },
        code: {
          bg: "#f5f5f5",
          text: "#111111",
        },
        // Optionally keep Tailwind's default palette for utility
        primary: {
          DEFAULT: "#1e3a8a", // Modern dark blue
          50: "#e6eafd",
          100: "#c3d0fa",
          200: "#9ab1f6",
          300: "#6e90f2",
          400: "#4a73ed",
          500: "#2856e9",
          600: "#1e3a8a", // Main
          700: "#192e5b",
          800: "#131f3a",
          900: "#0c1220",
        },
        background: {
          DEFAULT: "#10172a", // Deep blue background
        },
        accent: {
          DEFAULT: "#2563eb", // Accent blue
        },
        muted: {
          DEFAULT: "#1e293b", // Muted dark blue
        },
        foreground: {
          DEFAULT: "#f1f5f9", // Light text for dark bg
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1536px",
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
