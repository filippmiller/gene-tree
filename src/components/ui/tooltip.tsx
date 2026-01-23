"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/**
 * Premium Tooltip component with Stripe-level polish
 *
 * Features:
 * - Smooth fade + scale animations
 * - Multiple positioning options
 * - Dark/light variants
 * - Arrow pointer
 * - Keyboard accessible
 */

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: "default" | "light";
  }
>(({ className, variant = "default", sideOffset = 4, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg px-3 py-1.5",
        "text-xs font-medium",
        "shadow-elevation-3",
        // Animation
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        // Variants
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "light" && "bg-popover text-popover-foreground border",
        className
      )}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow
        className={cn(
          "fill-current",
          variant === "default" && "text-primary",
          variant === "light" && "text-popover"
        )}
      />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * Simple tooltip wrapper for common use case
 */
interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  variant?: "default" | "light";
  delayDuration?: number;
}

const SimpleTooltip = ({
  content,
  children,
  side = "top",
  variant = "default",
  delayDuration = 200,
}: SimpleTooltipProps) => (
  <Tooltip delayDuration={delayDuration}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} variant={variant}>
      {content}
    </TooltipContent>
  </Tooltip>
);

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
};
