"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Premium Progress component with Stripe-level polish
 *
 * Features:
 * - Multiple variants: default, success, warning, error
 * - Size options: sm, md, lg
 * - Animated fill with smooth transitions
 * - Optional label and value display
 * - Indeterminate state with shimmer
 */

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full transition-all duration-500 ease-smooth rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
        gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** Show percentage label */
  showValue?: boolean;
  /** Indeterminate loading state */
  indeterminate?: boolean;
  /** Label text */
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value,
      size,
      variant,
      showValue,
      indeterminate,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = value ?? 0;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-1.5">
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {showValue && !indeterminate && (
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressIndicatorVariants({ variant }),
              indeterminate && [
                "w-1/3",
                "animate-[progress-indeterminate_1.5s_ease-in-out_infinite]",
              ]
            )}
            style={
              indeterminate
                ? undefined
                : { width: `${percentage}%` }
            }
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

/**
 * Circular Progress / Spinner
 */
interface CircularProgressProps {
  value?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showValue?: boolean;
  indeterminate?: boolean;
  strokeWidth?: number;
  className?: string;
}

const CircularProgress = ({
  value = 0,
  size = "md",
  variant = "default",
  showValue,
  indeterminate,
  strokeWidth = 4,
  className,
}: CircularProgressProps) => {
  const sizeMap = { sm: 24, md: 40, lg: 64 };
  const dimension = sizeMap[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    default: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
    error: "text-red-500",
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        className={cn(
          indeterminate && "animate-spinner",
          colorMap[variant]
        )}
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
      >
        {/* Background circle */}
        <circle
          className="text-secondary"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className="transition-all duration-500 ease-smooth"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
        />
      </svg>
      {showValue && !indeterminate && size !== "sm" && (
        <span
          className={cn(
            "absolute font-semibold",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

export { Progress, CircularProgress, progressVariants };
