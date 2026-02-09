import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Midnight Glass Avatar Component
 *
 * Premium avatar design with ring effects
 *
 * Features:
 * - Multiple sizes
 * - Status indicator support
 * - Primary ring variant
 * - Smooth image loading transitions
 * - Elegant fallback styling
 */

const avatarVariants = cva(
  [
    "relative flex shrink-0 overflow-hidden",
    "transition-all duration-300",
  ].join(" "),
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-24 w-24 text-2xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-xl",
      },
      ring: {
        none: "",
        default: "ring-2 ring-border/50 ring-offset-2 ring-offset-background",
        primary: "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        gold: "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
      ring: "none",
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, shape, ring, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, shape, ring }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(
      "aspect-square h-full w-full object-cover",
      // Smooth loading transition
      "animate-fade-in",
      className
    )}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center",
      "bg-[#272D36] text-[#8B949E]",
      "font-medium uppercase",
      // Subtle inner shadow for depth
      "shadow-inner",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/**
 * Avatar with status indicator
 */
export interface AvatarWithStatusProps extends AvatarProps {
  status?: "online" | "offline" | "busy" | "away";
  src?: string;
  alt?: string;
  fallback?: string;
}

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-warning",
};

const AvatarWithStatus = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarWithStatusProps
>(({ status, src, alt, fallback, size = "md", ...props }, ref) => {
  // Status indicator sizes relative to avatar
  const statusSizes = {
    xs: "h-1.5 w-1.5 border",
    sm: "h-2 w-2 border",
    md: "h-2.5 w-2.5 border-2",
    lg: "h-3 w-3 border-2",
    xl: "h-4 w-4 border-2",
    "2xl": "h-5 w-5 border-2",
  };

  return (
    <div className="relative inline-block">
      <Avatar ref={ref} size={size} {...props}>
        {src && <AvatarImage src={src} alt={alt || ""} />}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0",
            "rounded-full border-background",
            "ring-2 ring-background",
            statusSizes[size || "md"],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
});
AvatarWithStatus.displayName = "AvatarWithStatus";

/**
 * Avatar group for displaying multiple avatars
 */
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps["size"];
  children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 5, size = "md", className, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleAvatars = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    // Overlap amounts based on size
    const overlapClass = {
      xs: "-ml-1.5",
      sm: "-ml-2",
      md: "-ml-3",
      lg: "-ml-4",
      xl: "-ml-5",
      "2xl": "-ml-6",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center", className)}
        {...props}
      >
        {visibleAvatars.map((child, index) => (
          <div
            key={index}
            className={cn(
              index > 0 && overlapClass[size || "md"],
              "relative hover:z-10 transition-transform hover:scale-110"
            )}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<AvatarProps>, {
                  size,
                  ring: "default",
                })
              : child}
          </div>
        ))}
        {remainingCount > 0 && (
          <Avatar
            size={size}
            className={cn(overlapClass[size || "md"], "hover:z-10")}
            ring="default"
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarImage, AvatarFallback, AvatarWithStatus, AvatarGroup, avatarVariants };
