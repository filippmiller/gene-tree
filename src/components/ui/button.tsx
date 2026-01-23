import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * World-class button component with Stripe-level polish
 *
 * Features:
 * - Multiple variants: default, secondary, outline, ghost, destructive, gradient, success
 * - Size variants: sm, md (default), lg, icon
 * - Built-in loading state with spinner
 * - Icon support (left, right, or icon-only)
 * - Smooth hover animations with lift effect
 * - Active/pressed state with subtle sink
 * - Full accessibility support
 */

const buttonVariants = cva(
  // Base styles - applies to ALL buttons
  [
    "group relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg text-sm font-semibold",
    "ring-offset-background transition-all duration-200 ease-smooth",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Smooth transform for hover/active states
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - Bold, confident, main CTAs
        default: [
          "bg-primary text-primary-foreground",
          "shadow-btn hover:shadow-btn-hover",
          "hover:-translate-y-0.5 hover:bg-primary/90",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Secondary - Subtle, supporting actions
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-btn hover:shadow-btn-hover",
          "hover:-translate-y-0.5 hover:bg-secondary/80",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Outline - Bordered, minimal weight
        outline: [
          "border-2 border-input bg-background",
          "hover:border-primary hover:bg-accent hover:text-accent-foreground",
          "hover:-translate-y-0.5 hover:shadow-btn-hover",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),

        // Ghost - Invisible until hover
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80 active:scale-[0.98]",
        ].join(" "),

        // Destructive - Dangerous actions
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-btn hover:shadow-btn-hover",
          "hover:-translate-y-0.5 hover:bg-destructive/90",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),

        // Link - Text-only, underline on hover
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "active:text-primary/80",
        ].join(" "),

        // Gradient - Premium, eye-catching CTAs (Violet theme)
        gradient: [
          "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 text-white",
          "shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30",
          "hover:-translate-y-0.5",
          "hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700",
          "active:translate-y-0 active:scale-[0.98]",
          // Subtle shine effect
          "before:absolute before:inset-0 before:rounded-lg",
          "before:bg-gradient-to-r before:from-white/0 before:via-white/25 before:to-white/0",
          "before:translate-x-[-100%] hover:before:translate-x-[100%]",
          "before:transition-transform before:duration-700 before:ease-out",
          "overflow-hidden",
        ].join(" "),

        // Success - Positive confirmations
        success: [
          "bg-emerald-600 text-white",
          "shadow-btn hover:shadow-btn-hover",
          "hover:-translate-y-0.5 hover:bg-emerald-700",
          "active:translate-y-0 active:shadow-btn-active active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md [&_svg]:size-3.5",
        default: "h-10 px-4 py-2 [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-xl [&_svg]:size-5",
        icon: "h-10 w-10 [&_svg]:size-4",
        "icon-sm": "h-8 w-8 rounded-md [&_svg]:size-3.5",
        "icon-lg": "h-12 w-12 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Loading spinner component
const ButtonSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spinner", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
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

    // For asChild, we pass through without modification
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
              size === "lg" || size === "icon-lg" ? "size-5" : "",
              !size || size === "default" || size === "icon" ? "size-4" : ""
            )}
          />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0">{leftIcon}</span>
        ) : null}

        {/* Button text - hidden when icon-only and loading */}
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
