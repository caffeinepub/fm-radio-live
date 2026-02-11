/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
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
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), 0 0 60px rgba(59, 130, 246, 0.1)',
        'glow-blue-lg': '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3), 0 0 90px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2), 0 0 60px rgba(16, 185, 129, 0.1)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2), 0 0 60px rgba(168, 85, 247, 0.1)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2), 0 0 60px rgba(239, 68, 68, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.15)',
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-top-4": {
          from: { transform: "translateY(-1rem)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom-5": {
          from: { transform: "translateY(1.25rem)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-to-top": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-100%)" },
        },
        "slide-out-to-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "signal-wave": {
          "0%": { 
            transform: "scale(0.5)", 
            opacity: "0.8" 
          },
          "100%": { 
            transform: "scale(2)", 
            opacity: "0" 
          },
        },
        "tower-pulse": {
          "0%, 100%": { 
            opacity: "1",
            transform: "scale(1)"
          },
          "50%": { 
            opacity: "0.85",
            transform: "scale(1.05)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "accordion-up": "accordion-up 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-out": "fade-out 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-from-top": "slide-in-from-top 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-from-bottom": "slide-in-from-bottom 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-out-to-top": "slide-out-to-top 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-out-to-bottom": "slide-out-to-bottom 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "signal-wave-1": "signal-wave 2s ease-out infinite",
        "signal-wave-2": "signal-wave 2s ease-out infinite 0.4s",
        "signal-wave-3": "signal-wave 2s ease-out infinite 0.8s",
        "tower-pulse": "tower-pulse 3s ease-in-out infinite",
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
