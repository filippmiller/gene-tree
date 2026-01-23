import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * World-class card component with Stripe-level polish
 *
 * Features:
 * - Elevation system: flat, raised (default), elevated, floating
 * - Interactive variant with hover lift and glow
 * - Smooth animations for entrance and hover states
 * - Compound components: Header, Title, Description, Content, Footer
 * - Full accessibility support for interactive cards
 */

const cardVariants = cva(
  // Base styles
  [
    "rounded-xl border bg-card text-card-foreground",
    "transition-all duration-250 ease-smooth",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      elevation: {
        // Flat - No shadow, just border
        flat: "shadow-none",

        // Raised - Subtle shadow (default)
        raised: "shadow-elevation-2",

        // Elevated - More prominent shadow
        elevated: "shadow-elevation-3",

        // Floating - Maximum elevation
        floating: "shadow-elevation-5",
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:-translate-y-1 hover:shadow-elevation-4",
          "hover:border-primary/20",
          "active:translate-y-0 active:shadow-elevation-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ].join(" "),
        false: "",
      },
      animated: {
        true: "animate-fade-in-up",
        false: "",
      },
    },
    defaultVariants: {
      elevation: "raised",
      interactive: false,
      animated: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, interactive, animated, ...props }, ref) => {
    const interactiveProps = interactive
      ? {
          tabIndex: 0,
          role: "button" as const,
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ elevation, interactive, animated, className }))}
        {...interactiveProps}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Hover-glow variant for special cards
const CardGlow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glowColor?: "primary" | "accent" | "success" | "warning";
  }
>(({ className, glowColor = "primary", ...props }, ref) => {
  const glowClasses = {
    primary: "hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]",
    accent: "hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.4)]",
    success: "hover:shadow-[0_0_30px_-5px_hsl(142_76%_36%/0.3)]",
    warning: "hover:shadow-[0_0_30px_-5px_hsl(38_92%_50%/0.3)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground",
        "shadow-elevation-2 transition-all duration-300 ease-smooth",
        "hover:-translate-y-1",
        glowClasses[glowColor],
        className
      )}
      {...props}
    />
  );
});
CardGlow.displayName = "CardGlow";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Stat card for dashboards - common pattern
const StatCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: { value: number; positive: boolean };
  }
>(({ className, label, value, icon, trend, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("overflow-hidden", className)}
    elevation="raised"
    {...props}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = "StatCard";

// Feature card for marketing/onboarding pages
const FeatureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon: React.ReactNode;
    title: string;
    description: string;
  }
>(({ className, icon, title, description, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("group", className)}
    elevation="raised"
    interactive
    {...props}
  >
    <CardContent className="p-6">
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </CardContent>
  </Card>
));
FeatureCard.displayName = "FeatureCard";

export {
  Card,
  CardGlow,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  FeatureCard,
  cardVariants,
};
