import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton loading component with shimmer animation
 *
 * Use for content placeholders during data fetching.
 * Creates a premium "skeleton screen" effect like Stripe/Linear.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Can be Tailwind class or CSS value */
  width?: string;
  /** Height of the skeleton. Can be Tailwind class or CSS value */
  height?: string;
  /** Makes the skeleton circular (for avatars) */
  circle?: boolean;
  /** Disables the shimmer animation */
  static?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, circle, static: isStatic, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted",
          circle ? "rounded-full" : "rounded-md",
          !isStatic && [
            "relative overflow-hidden",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
            "before:animate-shimmer",
          ],
          className
        )}
        style={{
          width: width,
          height: height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns for common use cases

/** Text line skeleton */
const SkeletonText = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "height"> & { lines?: number }
>(({ className, lines = 1, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          // Last line is shorter for natural look
          i === lines - 1 && lines > 1 && "w-3/4"
        )}
        {...props}
      />
    ))}
  </div>
));
SkeletonText.displayName = "SkeletonText";

/** Avatar skeleton */
const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "circle"> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton
      ref={ref}
      circle
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
});
SkeletonAvatar.displayName = "SkeletonAvatar";

/** Card skeleton with header and content */
const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card p-6 space-y-4",
      "shadow-elevation-2",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-4">
      <SkeletonAvatar size="md" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

/** Table row skeleton */
const SkeletonTableRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { columns?: number }
>(({ className, columns = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4 py-4", className)}
    {...props}
  >
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === 0 ? "w-1/4" : "flex-1"
        )}
      />
    ))}
  </div>
));
SkeletonTableRow.displayName = "SkeletonTableRow";

/** Button skeleton */
const SkeletonButton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "height" | "width"> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton
      ref={ref}
      className={cn(sizeClasses[size], "rounded-lg", className)}
      {...props}
    />
  );
});
SkeletonButton.displayName = "SkeletonButton";

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonButton,
};
