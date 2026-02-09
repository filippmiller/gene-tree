"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Living Archive Tabs Component
 *
 * Premium tab navigation with active states
 *
 * Features:
 * - Smooth animated active indicator
 * - Multiple style variants (pills, underline, cards)
 * - Golden glow on active state
 * - Keyboard accessible
 */

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        pills: [
          "p-1.5 rounded-2xl",
          "bg-muted/50 backdrop-blur-sm",
          "border border-border/30",
        ].join(" "),
        underline: [
          "border-b border-border/50",
          "gap-1",
        ].join(" "),
        cards: [
          "gap-2",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "pills",
    },
  }
);

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "text-sm font-medium",
    "transition-all duration-300 ease-cinematic",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        pills: [
          "px-4 py-2.5 rounded-xl",
          "text-muted-foreground",
          "hover:text-foreground hover:bg-muted/50",
          // Active state - flat primary
          "data-[state=active]:bg-primary",
          "data-[state=active]:text-primary-foreground",
        ].join(" "),
        underline: [
          "px-4 py-3 -mb-px",
          "text-muted-foreground",
          "border-b-2 border-transparent",
          "hover:text-foreground hover:border-border",
          // Active state
          "data-[state=active]:text-primary data-[state=active]:border-primary",
        ].join(" "),
        cards: [
          "px-5 py-3 rounded-xl",
          "text-muted-foreground",
          "border border-transparent",
          "hover:bg-muted/50 hover:border-border/30",
          // Active state
          "data-[state=active]:bg-card data-[state=active]:border-primary/30",
          "data-[state=active]:text-foreground",
          "data-[state=active]:shadow-elevation-2",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "pills",
    },
  }
);

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      // Entrance animation
      "animate-fade-in-up",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
