/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Light theme custom palette
        "surface": "oklch(1 0 0)",
        "surface-warm": "oklch(0.97 0.015 60)",
        "surface-peach": "oklch(0.95 0.04 40)",
        "coral": {
          50: "oklch(0.97 0.03 25)",
          100: "oklch(0.93 0.06 25)",
          200: "oklch(0.87 0.10 25)",
          300: "oklch(0.80 0.14 25)",
          400: "oklch(0.72 0.17 25)",
          500: "oklch(0.62 0.18 25)",
          600: "oklch(0.54 0.18 25)",
          700: "oklch(0.46 0.16 25)",
        },
        "warm": {
          50: "oklch(0.98 0.02 60)",
          100: "oklch(0.95 0.04 60)",
          200: "oklch(0.90 0.07 60)",
          300: "oklch(0.84 0.10 60)",
          400: "oklch(0.78 0.12 55)",
          500: "oklch(0.70 0.14 55)",
        },
        "peach": {
          50: "oklch(0.98 0.02 40)",
          100: "oklch(0.95 0.04 40)",
          200: "oklch(0.90 0.07 40)",
          300: "oklch(0.84 0.10 40)",
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 16px oklch(0.18 0.02 250 / 0.08)",
        medium: "0 4px 24px oklch(0.18 0.02 250 / 0.12)",
        warm: "0 4px 20px oklch(0.62 0.18 25 / 0.15)",
        card: "0 1px 4px oklch(0.18 0.02 250 / 0.06), 0 4px 16px oklch(0.18 0.02 250 / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "signal-wave": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "tower-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "quick-play-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(0.97)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "signal-wave": "signal-wave 2s ease-out infinite",
        "tower-pulse": "tower-pulse 1.5s ease-in-out infinite",
        "quick-play-pulse": "quick-play-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
