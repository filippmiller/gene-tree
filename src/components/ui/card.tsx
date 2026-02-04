import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Living Archive Card Component
 *
 * Cinematic card design with warm metallics and atmospheric depth
 *
 * Features:
 * - Elevation system: flat, raised (default), elevated, floating
 * - Interactive variant with hover lift and golden glow
 * - Smooth entrance animations
 * - Compound components: Header, Title, Description, Content, Footer
 * - Special variants: StatCard, FeatureCard, StoryCard
 */

const cardVariants = cva(
  // Base styles
  [
    "rounded-2xl border bg-card text-card-foreground",
    "transition-all duration-400 ease-cinematic",
    "transform-gpu",
  ].join(" "),
  {
    variants: {
      elevation: {
        // Flat - No shadow, just border
        flat: "shadow-none border-border/50",

        // Raised - Subtle shadow (default)
        raised: [
          "shadow-elevation-2 border-border/30",
          "shadow-inner-glow",
        ].join(" "),

        // Elevated - More prominent shadow
        elevated: [
          "shadow-elevation-3 border-border/20",
          "shadow-inner-glow",
        ].join(" "),

        // Floating - Maximum elevation with glow
        floating: [
          "shadow-elevation-5 border-primary/10",
          "shadow-inner-glow",
        ].join(" "),
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:-translate-y-1 hover:shadow-archive-hover",
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
      glow: {
        true: "hover:shadow-glow-primary",
        false: "",
      },
    },
    defaultVariants: {
      elevation: "raised",
      interactive: false,
      animated: false,
      glow: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, interactive, animated, glow, ...props }, ref) => {
    const interactiveProps = interactive
      ? {
          tabIndex: 0,
          role: "button" as const,
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ elevation, interactive, animated, glow, className }))}
        {...interactiveProps}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Special glow variant for premium cards
const CardGlow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glowColor?: "primary" | "accent" | "success" | "warning";
  }
>(({ className, glowColor = "primary", ...props }, ref) => {
  const glowClasses = {
    primary: "hover:shadow-glow-primary",
    accent: "hover:shadow-glow-accent",
    success: "hover:shadow-[0_0_24px_-6px_hsl(var(--success)/0.4)]",
    warning: "hover:shadow-[0_0_24px_-6px_hsl(var(--warning)/0.4)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border/30 bg-card text-card-foreground",
        "shadow-elevation-2 shadow-inner-glow",
        "transition-all duration-400 ease-cinematic",
        "hover:-translate-y-1 hover:border-primary/20",
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
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-xl font-medium leading-tight tracking-tight",
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
  <p
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
    className={cn(
      "flex items-center p-6 pt-4 border-t border-border/30",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Stat card for dashboards
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
    className={cn("overflow-hidden group", className)}
    elevation="raised"
    {...props}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </p>
          <p className="text-4xl font-display font-medium tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              <span className="text-lg">{trend.positive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "rounded-xl p-3.5",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary group-hover:text-primary-foreground",
            "transition-all duration-300"
          )}>
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
    glow
    {...props}
  >
    <CardContent className="p-6">
      <div className={cn(
        "mb-5 inline-flex rounded-xl p-3.5",
        "bg-primary/10 text-primary",
        "group-hover:bg-primary group-hover:text-primary-foreground",
        "transition-all duration-300"
      )}>
        {icon}
      </div>
      <h3 className="mb-2 font-display text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </CardContent>
  </Card>
));
FeatureCard.displayName = "FeatureCard";

// Story card for memory preservation
const StoryCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    author?: string;
    date?: string;
    image?: string;
  }
>(({ className, author, date, image, children, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "group overflow-hidden",
      "bg-gradient-to-br from-card to-card/95",
      className
    )}
    elevation="elevated"
    interactive
    {...props}
  >
    {/* Subtle radial gradient overlay */}
    <div className="absolute inset-0 pointer-events-none opacity-30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
    </div>

    {image && (
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt=""
          className={cn(
            "w-full h-full object-cover",
            "group-hover:scale-105 transition-transform duration-700"
          )}
        />
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
      </div>
    )}

    <CardContent className={cn("relative z-10", image ? "pt-4" : "pt-6")}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {children}
      </div>

      {(author || date) && (
        <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-sm text-muted-foreground">
          {author && <span className="font-medium">{author}</span>}
          {date && <span>{date}</span>}
        </div>
      )}
    </CardContent>
  </Card>
));
StoryCard.displayName = "StoryCard";

// Archive card - premium variant with golden accents
const ArchiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "archive-card p-6",
      className
    )}
    {...props}
  />
));
ArchiveCard.displayName = "ArchiveCard";

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
  StoryCard,
  ArchiveCard,
  cardVariants,
};
