"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Midnight Glass GlassCard
 *
 * Premium glassmorphism card with blue accents
 * Provides atmospheric depth and cinematic feel
 */

const glassCardVariants = cva(
  // Base styles
  [
    "rounded-2xl transition-all duration-400 ease-cinematic",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      glass: {
        // Subtle - Light glass, barely noticeable
        subtle: [
          "bg-card/70 dark:bg-card/70",
          "backdrop-blur-sm",
          "border border-border/30",
        ].join(" "),

        // Medium - Standard glass card (default)
        medium: [
          "bg-card/60 dark:bg-card/80",
          "backdrop-blur-md",
          "border border-border/30",
          "shadow-elevation-2",
        ].join(" "),

        // Frosted - Heavy blur, prominent glass effect
        frosted: [
          "bg-card/50 dark:bg-card/70",
          "backdrop-blur-xl",
          "border border-border/20",
          "shadow-elevation-4",
        ].join(" "),

        // Tinted - Same as frosted
        tinted: [
          "bg-card/50 dark:bg-card/70",
          "backdrop-blur-xl",
          "border border-border/20",
          "shadow-elevation-4",
        ].join(" "),

        // Solid - No glass, just elevated card
        solid: [
          "bg-card",
          "border border-border/30",
          "shadow-elevation-2",
        ].join(" "),

        // Dark - For overlay/modal backgrounds
        dark: [
          "bg-background/90 dark:bg-background/95",
          "backdrop-blur-xl",
          "border border-border/20",
          "shadow-elevation-5",
        ].join(" "),
      },
      hover: {
        none: "",
        lift: [
          "hover:-translate-y-1",
          "hover:shadow-elevation-4",
          "hover:border-primary/20",
        ].join(" "),
        glow: [
          "hover:shadow-glow-primary",
          "hover:border-primary/30",
        ].join(" "),
        scale: "hover:scale-[1.02]",
        subtle: [
          "hover:bg-card/80",
          "hover:border-primary/20",
        ].join(" "),
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      glass: "medium",
      hover: "none",
      padding: "sm",
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
    className={cn("flex flex-col space-y-2", className)}
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
      "font-display text-xl font-medium leading-tight tracking-tight text-foreground",
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
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
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
