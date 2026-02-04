import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Living Archive Badge Component
 *
 * Premium badge design with golden accents
 *
 * Features:
 * - Multiple variants: default (gold), secondary, outline, destructive, success, warning
 * - Size variants: sm, md, lg
 * - Optional dot indicator for status
 * - Removable badges with close button
 * - Smooth hover animations
 * - Golden glow effect on primary badges
 */

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5",
    "font-medium transition-all duration-300",
    "rounded-full border",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default - Golden/Primary
        default: [
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary/30",
          "shadow-glow hover:shadow-glow-lg",
        ].join(" "),

        secondary: [
          "bg-secondary text-secondary-foreground border-transparent",
          "hover:bg-secondary/80",
        ].join(" "),

        outline: [
          "bg-transparent text-foreground border-border",
          "hover:bg-muted hover:border-primary/30",
        ].join(" "),

        // Archive variant - subtle gold
        archive: [
          "bg-primary/10 text-primary border-primary/20",
          "hover:bg-primary/20 hover:border-primary/30",
        ].join(" "),

        destructive: [
          "bg-destructive/10 text-destructive border-destructive/20",
          "hover:bg-destructive/20",
        ].join(" "),

        success: [
          "bg-success/10 text-success border-success/20",
          "hover:bg-success/20",
        ].join(" "),

        warning: [
          "bg-warning/10 text-warning border-warning/20",
          "hover:bg-warning/20",
        ].join(" "),

        info: [
          "bg-blue-500/10 text-blue-600 border-blue-500/20",
          "dark:text-blue-400",
          "hover:bg-blue-500/20",
        ].join(" "),
      },
      size: {
        sm: "text-[10px] px-2 py-0.5 [&_svg]:size-3",
        md: "text-xs px-2.5 py-0.5 [&_svg]:size-3.5",
        lg: "text-sm px-3 py-1 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Shows a pulsing dot indicator */
  dot?: boolean;
  /** Color of the dot indicator */
  dotColor?: "default" | "success" | "warning" | "destructive";
  /** Makes the badge removable with a close button */
  removable?: boolean;
  /** Called when the remove button is clicked */
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      dotColor = "default",
      removable,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    const dotColorClasses = {
      default: "bg-current",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotColorClasses[dotColor]
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                dotColorClasses[dotColor]
              )}
            />
          </span>
        )}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={cn(
              "ml-0.5 -mr-1 rounded-full p-0.5",
              "hover:bg-black/10 dark:hover:bg-white/10",
              "focus:outline-none focus:ring-1 focus:ring-current",
              "transition-colors"
            )}
            aria-label="Remove"
          >
            <svg
              className={cn(
                size === "sm" ? "h-2.5 w-2.5" : "",
                size === "md" ? "h-3 w-3" : "",
                size === "lg" ? "h-3.5 w-3.5" : ""
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Status badge with predefined states
type StatusType = "online" | "offline" | "busy" | "away" | "pending" | "verified";

const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "variant" | "dot" | "dotColor"> & {
    status: StatusType;
  }
>(({ status, children, ...props }, ref) => {
  const statusConfig: Record<
    StatusType,
    { variant: BadgeProps["variant"]; dotColor: BadgeProps["dotColor"]; label: string }
  > = {
    online: { variant: "success", dotColor: "success", label: "Online" },
    offline: { variant: "secondary", dotColor: "default", label: "Offline" },
    busy: { variant: "destructive", dotColor: "destructive", label: "Busy" },
    away: { variant: "warning", dotColor: "warning", label: "Away" },
    pending: { variant: "warning", dotColor: "warning", label: "Pending" },
    verified: { variant: "archive", dotColor: "success", label: "Verified" },
  };

  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      dot
      dotColor={config.dotColor}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
});
StatusBadge.displayName = "StatusBadge";

export { Badge, StatusBadge, badgeVariants };
