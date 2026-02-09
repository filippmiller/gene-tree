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
      /* ═══════════════════════════════════════════════════════════════════════
         TYPOGRAPHY - Midnight Glass Design System
         ═══════════════════════════════════════════════════════════════════════ */
      fontFamily: {
        // Modern sans-serif for display/headings
        display: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
        // Modern sans for body text
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        // Monospace for data/code
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // Legacy alias
        heritage: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },

      /* ═══════════════════════════════════════════════════════════════════════
         COLOR SYSTEM
         ═══════════════════════════════════════════════════════════════════════ */
      colors: {
        // Semantic colors from CSS variables
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

        // Chart colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // Midnight Glass Palette
        archive: {
          // Blue accent spectrum
          blue: {
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#58A6FF",
            600: "#3b82f6",
            700: "#2563eb",
            800: "#1d4ed8",
            900: "#1e40af",
          },
          // Teal accent spectrum
          teal: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#3FB9A0",
            500: "#14b8a6",
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
          },
          // Dark backgrounds (Midnight Glass)
          void: "#0A0D12",
          obsidian: "#0F1116",
          charcoal: "#161B22",
          smoke: "#272D36",
          // Light text
          platinum: "#E6EDF3",
          silver: "#8B949E",
          ivory: "#F0F6FC",
        },

        // Generation colors for tree visualization
        generation: {
          0: "hsl(var(--chart-1))",
          1: "hsl(var(--chart-2))",
          2: "hsl(var(--chart-3))",
          3: "hsl(var(--chart-4))",
          4: "hsl(var(--chart-5))",
        },

        // Relationship type colors (flat, no gradients)
        relation: {
          parent: "#58A6FF",
          child: "#56D4DD",
          spouse: "#F778BA",
          sibling: "#3FB950",
        },

        // Utility colors
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

      /* ═══════════════════════════════════════════════════════════════════════
         BORDER RADIUS
         ═══════════════════════════════════════════════════════════════════════ */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "pill": "9999px",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         SHADOWS - Clean depth system
         ═══════════════════════════════════════════════════════════════════════ */
      boxShadow: {
        // Elevation system
        "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elevation-2": "0 2px 8px -2px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06)",
        "elevation-3": "0 4px 16px -4px rgb(0 0 0 / 0.12), 0 2px 4px rgb(0 0 0 / 0.06)",
        "elevation-4": "0 8px 32px -8px rgb(0 0 0 / 0.16), 0 4px 8px rgb(0 0 0 / 0.08)",
        "elevation-5": "0 16px 64px -16px rgb(0 0 0 / 0.2), 0 8px 16px rgb(0 0 0 / 0.1)",

        // Button shadows
        "btn": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06)",
        "btn-hover": "0 4px 16px -4px rgb(0 0 0 / 0.15), 0 2px 4px rgb(0 0 0 / 0.08)",
        "btn-active": "0 1px 2px rgb(0 0 0 / 0.08), inset 0 1px 2px rgb(0 0 0 / 0.06)",

        // Archive card shadows
        "archive": "0 4px 24px -4px rgb(0 0 0 / 0.12), 0 1px 3px rgb(0 0 0 / 0.08)",
        "archive-hover": "0 8px 40px -8px rgb(0 0 0 / 0.2), 0 4px 8px rgb(0 0 0 / 0.1)",

        // Photo frame shadow
        "frame": "0 4px 20px -4px rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.1)",

        // Glow effects - blue accent
        "glow": "0 0 20px -5px hsl(212 92% 67% / 0.3)",
        "glow-lg": "0 0 40px -8px hsl(212 92% 67% / 0.4)",
        "glow-primary": "0 0 24px -6px hsl(var(--primary) / 0.4)",
        "glow-accent": "0 0 24px -6px hsl(var(--accent) / 0.4)",

        // Glass shadow
        "glass": "0 8px 32px rgb(0 0 0 / 0.12)",
        "glass-hover": "0 12px 48px rgb(0 0 0 / 0.16)",

        // Inner shadows
        "inner": "inset 0 2px 4px rgb(0 0 0 / 0.06)",
        "inner-glow": "inset 0 1px 0 hsl(var(--primary) / 0.05)",

        // Legacy aliases
        "heritage": "0 4px 24px -4px rgb(0 0 0 / 0.12)",
        "heritage-hover": "0 8px 40px -8px rgb(0 0 0 / 0.2)",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         BACKDROP BLUR
         ═══════════════════════════════════════════════════════════════════════ */
      backdropBlur: {
        xs: "2px",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         GRADIENTS
         ═══════════════════════════════════════════════════════════════════════ */
      backgroundImage: {
        // Glass gradient (subtle dark gradient for glass surfaces)
        "gradient-glass": "linear-gradient(180deg, hsl(220 13% 9% / 0.8) 0%, hsl(220 13% 7% / 0.9) 100%)",
        // Cinematic gradient
        "gradient-cinematic": "linear-gradient(180deg, #0F1116 0%, #161B22 100%)",
        // Radial spotlight
        "spotlight": "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.06), transparent 40%)",
        // Legacy aliases (now use CSS variable-based primary)
        "gradient-gold": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
        "gradient-heritage": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         ANIMATIONS
         ═══════════════════════════════════════════════════════════════════════ */
      keyframes: {
        // Entrance animations
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },

        // Interactive animations
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px -5px hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.6)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },

        // Utility animations
        "spinner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },

        // Card animations
        "card-enter": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "lift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },

        // Button press
        "btn-press": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
        },
      },

      animation: {
        // Entrance
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "fade-in-down": "fade-in-down 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.4s ease-out",

        // Interactive
        "float": "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",

        // Utility
        "spinner": "spinner 0.7s linear infinite",
        "wiggle": "wiggle 0.5s ease-in-out",

        // Card/component
        "card-enter": "card-enter 0.5s ease-out",
        "lift": "lift 0.3s ease-out forwards",
        "btn-press": "btn-press 0.15s ease-in-out",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         TIMING FUNCTIONS
         ═══════════════════════════════════════════════════════════════════════ */
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "snap": "cubic-bezier(0.2, 0, 0, 1)",
        "cinematic": "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "600": "600ms",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         SPACING
         ═══════════════════════════════════════════════════════════════════════ */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "128": "32rem",
        "144": "36rem",
      },

      /* ═══════════════════════════════════════════════════════════════════════
         Z-INDEX
         ═══════════════════════════════════════════════════════════════════════ */
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [],
};

export default config;
