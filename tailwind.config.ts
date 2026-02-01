import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Heritage serif for headings
        heritage: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        // Modern sans for body
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
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
        // Heritage palette
        heritage: {
          sage: {
            50: "#f4f7f2",
            100: "#e5ebe1",
            200: "#cad8c3",
            300: "#a8bf9d",
            400: "#82a172",
            500: "#638552", // Primary sage
            600: "#4d6a40",
            700: "#3f5535",
            800: "#35452e",
            900: "#2d3a27",
          },
          amber: {
            50: "#fdf8f1",
            100: "#f9eddd",
            200: "#f2d9b9",
            300: "#e9c08d",
            400: "#dea05f",
            500: "#d4874a", // Accent amber
            600: "#c66f3a",
            700: "#a55631",
            800: "#85462d",
            900: "#6d3b27",
          },
          cream: {
            50: "#fefdfb",
            100: "#fcf9f3",
            200: "#f8f2e7",
            300: "#f2e7d5",
            400: "#e9d5b8",
            500: "#dfc49c",
          },
          paper: "hsl(var(--paper))",
          sepia: "hsl(var(--sepia))",
          antique: "hsl(var(--antique))",
        },
        // Generation colors (for family tree visualization)
        generation: {
          0: "hsl(var(--generation-0))",
          1: "hsl(var(--generation-1))",
          2: "hsl(var(--generation-2))",
          3: "hsl(var(--generation-3))",
          4: "hsl(var(--generation-4))",
        },
        // Relationship type colors
        relation: {
          parent: "hsl(var(--relation-parent))",
          child: "hsl(var(--relation-child))",
          spouse: "hsl(var(--relation-spouse))",
          sibling: "hsl(var(--relation-sibling))",
        },
        // Category colors retained for backward compatibility
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        rose: {
          50: "#fff1f2",
          100: "#ffe4e6",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        teal: {
          500: "#14b8a6",
          600: "#0d9488",
        },
        indigo: {
          500: "#6366f1",
          600: "#4f46e5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        // Heritage-specific
        "heritage": "1.25rem",
        "heritage-lg": "1.5rem",
        "pill": "9999px",
      },
      boxShadow: {
        // Elevation system with warm heritage tint
        "elevation-1": "0 1px 2px 0 rgb(45 58 39 / 0.05)",
        "elevation-2": "0 2px 6px rgb(45 58 39 / 0.06), 0 1px 2px rgb(45 58 39 / 0.04)",
        "elevation-3": "0 4px 12px rgb(45 58 39 / 0.08), 0 2px 4px rgb(45 58 39 / 0.04)",
        "elevation-4": "0 8px 24px rgb(45 58 39 / 0.10), 0 4px 8px rgb(45 58 39 / 0.05)",
        "elevation-5": "0 16px 48px rgb(45 58 39 / 0.12), 0 8px 16px rgb(45 58 39 / 0.06)",
        // Button shadows
        "btn": "0 1px 3px rgb(45 58 39 / 0.08)",
        "btn-hover": "0 4px 12px rgb(45 58 39 / 0.12), 0 2px 4px rgb(45 58 39 / 0.06)",
        "btn-active": "0 1px 2px rgb(45 58 39 / 0.08)",
        // Heritage card shadow
        "heritage": "0 2px 8px rgb(45 58 39 / 0.06), 0 1px 2px rgb(45 58 39 / 0.04)",
        "heritage-hover": "0 8px 24px rgb(45 58 39 / 0.10), 0 4px 8px rgb(45 58 39 / 0.05)",
        // Photo frame shadow
        "frame": "0 4px 16px rgb(45 58 39 / 0.12), 0 2px 4px rgb(45 58 39 / 0.08)",
        // Glow effects
        "glow": "0 0 24px rgb(99 133 82 / 0.25)",
        "glow-lg": "0 0 48px rgb(99 133 82 / 0.30)",
        "glow-primary": "0 0 20px -5px hsl(var(--primary) / 0.4)",
        "glow-accent": "0 0 20px -5px hsl(var(--accent) / 0.5)",
        // Glass shadow
        "glass": "0 8px 32px rgb(45 58 39 / 0.08)",
        "glass-hover": "0 12px 40px rgb(45 58 39 / 0.12)",
        // Inner shadow for depth
        "inner-heritage": "inset 0 2px 4px rgb(45 58 39 / 0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        // Heritage gradients
        "gradient-heritage": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
        "gradient-warm": "linear-gradient(135deg, hsl(40 30% 98%) 0%, hsl(35 45% 95%) 100%)",
        "gradient-paper": "linear-gradient(180deg, hsl(var(--paper)) 0%, hsl(var(--antique)) 100%)",
      },
      keyframes: {
        // Button press animation
        "btn-press": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
        },
        // Shimmer for loading states
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Subtle float for hover
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        // Gentle lift
        "lift": {
          "0%": { transform: "translateY(0)", boxShadow: "0 2px 8px rgb(45 58 39 / 0.06)" },
          "100%": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgb(45 58 39 / 0.12)" },
        },
        // Pulse glow
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 20px 5px hsl(var(--primary) / 0.2)" },
        },
        // Fade in up for cards
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Scale in
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Spinner
        "spinner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // Progress indeterminate
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        // Subtle wiggle for hints/notifications
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        // Entrance for cards
        "card-enter": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "btn-press": "btn-press 0.15s ease-in-out",
        "shimmer": "shimmer 2s infinite linear",
        "float": "float 3s ease-in-out infinite",
        "lift": "lift 0.3s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "spinner": "spinner 0.6s linear infinite",
        "wiggle": "wiggle 0.6s ease-in-out",
        "card-enter": "card-enter 0.5s ease-out",
      },
      transitionTimingFunction: {
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "snap": "cubic-bezier(0.2, 0, 0, 1)",
        "heritage": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
      },
      spacing: {
        // Heritage spacing scale
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
