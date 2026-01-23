import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Premium Alert component with Stripe-level polish
 *
 * Features:
 * - Multiple variants: info, success, warning, error
 * - Optional icon slot
 * - Dismissible with animation
 * - Title + description structure
 * - Smooth entrance animation
 */

const alertVariants = cva(
  [
    "relative w-full rounded-xl border p-4",
    "flex gap-3",
    "animate-fade-in-up",
    "[&>svg]:shrink-0 [&>svg]:mt-0.5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-background text-foreground border-border",
          "[&>svg]:text-foreground",
        ].join(" "),

        info: [
          "bg-blue-50 text-blue-900 border-blue-200",
          "dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800",
          "[&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
        ].join(" "),

        success: [
          "bg-emerald-50 text-emerald-900 border-emerald-200",
          "dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800",
          "[&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        ].join(" "),

        warning: [
          "bg-amber-50 text-amber-900 border-amber-200",
          "dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800",
          "[&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        ].join(" "),

        error: [
          "bg-red-50 text-red-900 border-red-200",
          "dark:bg-red-950/50 dark:text-red-100 dark:border-red-800",
          "[&>svg]:text-red-600 dark:[&>svg]:text-red-400",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Default icons for each variant
const AlertIcons = {
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  default: null,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Show default icon for variant (default: true for non-default variants) */
  showIcon?: boolean;
  /** Make alert dismissible */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant,
      icon,
      showIcon = variant !== "default",
      dismissible,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);

    if (dismissed) return null;

    const displayIcon = icon ?? (showIcon ? AlertIcons[variant || "default"] : null);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {displayIcon}
        <div className="flex-1 min-w-0">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className={cn(
              "shrink-0 rounded-md p-1 -m-1",
              "opacity-70 hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "transition-opacity"
            )}
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-1 text-sm opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
