import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Living Archive Button Component
 *
 * Premium, cinematic button design with golden accents
 *
 * Features:
 * - Multiple variants: default (gold), secondary, outline, ghost, destructive, gradient
 * - Size variants: sm, default, lg, icon variants
 * - Built-in loading state with elegant spinner
 * - Icon support (left, right, or icon-only)
 * - Smooth hover animations with lift and glow
 * - Active/pressed state with subtle sink
 */

const buttonVariants = cva(
  // Base styles
  [
    "group relative inline-flex items-center justify-center gap-2.5",
    "whitespace-nowrap text-sm font-medium",
    "ring-offset-background transition-all duration-300 ease-cinematic",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Golden accent, main CTAs
        default: [
          "bg-primary text-primary-foreground font-semibold",
          "shadow-btn",
          "hover:-translate-y-0.5 hover:shadow-glow-primary",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
          // Subtle inner highlight
          "before:absolute before:inset-0 before:rounded-[inherit]",
          "before:bg-gradient-to-b before:from-white/10 before:to-transparent",
          "before:opacity-100",
        ].join(" "),

        // Secondary - Muted, supporting actions
        secondary: [
          "bg-secondary text-secondary-foreground",
          "border border-border/50",
          "shadow-btn",
          "hover:-translate-y-0.5 hover:bg-secondary/80 hover:border-primary/20",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Outline - Bordered, minimal weight
        outline: [
          "border-2 border-border bg-transparent",
          "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),

        // Ghost - Invisible until hover
        ghost: [
          "hover:bg-muted hover:text-foreground",
          "active:bg-muted/80 active:scale-[0.98]",
        ].join(" "),

        // Destructive - Dangerous actions
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-btn",
          "hover:-translate-y-0.5 hover:bg-destructive/90",
          "hover:shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.4)]",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Link - Text-only, underline on hover
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "active:text-primary/80",
        ].join(" "),

        // Gradient - Premium, eye-catching CTAs (Gold gradient)
        gradient: [
          "text-primary-foreground font-semibold",
          "bg-gradient-to-r from-archive-gold-500 via-primary to-archive-copper-500",
          "shadow-glow",
          "hover:-translate-y-0.5 hover:shadow-glow-lg",
          "active:translate-y-0 active:scale-[0.98]",
          // Shine effect
          "before:absolute before:inset-0 before:rounded-[inherit]",
          "before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-700 before:ease-out",
          "overflow-hidden",
        ].join(" "),

        // Success - Positive confirmations
        success: [
          "bg-success text-success-foreground",
          "shadow-btn",
          "hover:-translate-y-0.5 hover:bg-success/90",
          "hover:shadow-[0_0_20px_-5px_hsl(var(--success)/0.4)]",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Copper - Accent variant
        copper: [
          "bg-accent text-accent-foreground font-semibold",
          "shadow-btn",
          "hover:-translate-y-0.5 hover:shadow-glow-accent",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        sm: "h-9 px-4 text-xs rounded-lg [&_svg]:size-3.5",
        default: "h-11 px-5 py-2.5 rounded-xl [&_svg]:size-4",
        lg: "h-13 px-7 text-base rounded-xl [&_svg]:size-5",
        xl: "h-14 px-8 text-base rounded-2xl [&_svg]:size-5",
        icon: "h-11 w-11 rounded-xl [&_svg]:size-4",
        "icon-sm": "h-9 w-9 rounded-lg [&_svg]:size-3.5",
        "icon-lg": "h-13 w-13 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Elegant loading spinner
const ButtonSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spinner", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-20"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-80"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    // For asChild, pass through without modification
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* Loading spinner - replaces left icon when loading */}
        {loading ? (
          <ButtonSpinner
            className={cn(
              size === "sm" || size === "icon-sm" ? "size-3.5" : "",
              size === "lg" || size === "icon-lg" || size === "xl" ? "size-5" : "",
              !size || size === "default" || size === "icon" ? "size-4" : ""
            )}
          />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0">{leftIcon}</span>
        ) : null}

        {/* Button text */}
        {children && (
          <span
            className={cn(
              "truncate",
              loading && (size === "icon" || size === "icon-sm" || size === "icon-lg")
                ? "sr-only"
                : ""
            )}
          >
            {children}
          </span>
        )}

        {/* Right icon */}
        {rightIcon && !loading && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
