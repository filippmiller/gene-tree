"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GlassCard - Modern glassmorphism card component
 *
 * Provides frosted glass effect with multiple intensity levels.
 * Supports hover animations, glow effects, and color tints.
 */

const glassCardVariants = cva(
  // Base styles
  [
    "rounded-2xl transition-all duration-300 ease-out",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      glass: {
        // Subtle - Light glass, barely noticeable
        subtle: [
          "bg-white/70 dark:bg-gray-900/70",
          "backdrop-blur-sm",
          "border border-white/50 dark:border-white/10",
        ].join(" "),

        // Medium - Standard glass card (default)
        medium: [
          "bg-white/60 dark:bg-gray-900/60",
          "backdrop-blur-md",
          "border border-white/40 dark:border-white/10",
          "shadow-glass",
        ].join(" "),

        // Frosted - Heavy blur, prominent glass effect
        frosted: [
          "bg-white/50 dark:bg-gray-900/50",
          "backdrop-blur-lg",
          "border border-white/30 dark:border-white/10",
          "shadow-elevation-4",
        ].join(" "),

        // Tinted - Glass with primary color tint
        tinted: [
          "bg-gradient-to-br from-violet-500/10 to-sky-500/5",
          "dark:from-violet-500/20 dark:to-sky-500/10",
          "backdrop-blur-md",
          "border border-violet-500/20 dark:border-violet-400/20",
          "shadow-glass",
        ].join(" "),

        // Solid - No glass, just elevated card
        solid: [
          "bg-card",
          "border border-border",
          "shadow-elevation-2",
        ].join(" "),
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-glass-hover",
        glow: "hover:shadow-glow hover:border-violet-500/30",
        scale: "hover:scale-[1.02]",
        subtle: "hover:bg-white/70 dark:hover:bg-gray-900/70 hover:border-violet-500/20",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      glass: "medium",
      hover: "none",
      padding: "md",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glass, hover, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ glass, hover, padding, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

/**
 * GlassCardHeader - Header section for glass cards
 */
const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

/**
 * GlassCardTitle - Title for glass cards
 */
const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

/**
 * GlassCardDescription - Description for glass cards
 */
const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

/**
 * GlassCardContent - Content area for glass cards
 */
const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  glassCardVariants,
};
