"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Users,
  Crown,
  Baby,
  Sparkles,
  Users2,
  Heart,
  Network,
  type LucideIcon,
} from "lucide-react";

/**
 * IconBadge - Gradient icon badge for category headers
 *
 * Replaces emoji icons with professional Lucide icons on gradient backgrounds.
 * Used for relationship categories, feature cards, and section headers.
 */

const iconBadgeVariants = cva(
  // Base styles
  [
    "flex items-center justify-center",
    "rounded-xl",
    "shadow-none",
    "transition-all duration-300",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "w-8 h-8 [&_svg]:w-4 [&_svg]:h-4",
        md: "w-10 h-10 [&_svg]:w-5 [&_svg]:h-5",
        lg: "w-12 h-12 [&_svg]:w-6 [&_svg]:h-6",
        xl: "w-14 h-14 [&_svg]:w-7 [&_svg]:h-7",
      },
      variant: {
        // Parents - Primary Blue
        parents: "bg-[#58A6FF] text-white shadow-none",
        // Grandparents - Accent Teal
        grandparents: "bg-[#3FB9A0] text-white shadow-none",
        // Children - Cyan
        children: "bg-[#56D4DD] text-white shadow-none",
        // Grandchildren - Indigo
        grandchildren: "bg-[#8B8FFF] text-white shadow-none",
        // Siblings - Green
        siblings: "bg-[#3FB950] text-white shadow-none",
        // Spouses - Pink
        spouses: "bg-[#F778BA] text-white shadow-none",
        // Extended family - Muted
        extended: "bg-[#8B949E] text-white shadow-none",
        // Default - Primary Blue
        default: "bg-[#58A6FF] text-white shadow-none",
        // Neutral - Dark Gray
        neutral: "bg-[#484F58] text-white shadow-none",
        // Success - Green
        success: "bg-[#3FB950] text-white shadow-none",
        // Warning - Gold
        warning: "bg-[#D29922] text-white shadow-none",
        // Outline - No fill, just border
        outline: "bg-white/5 border-2 border-[#30363D] text-[#8B949E] shadow-none",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface IconBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconBadgeVariants> {
  icon?: LucideIcon;
}

const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps>(
  ({ className, size, variant, icon: Icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconBadgeVariants({ size, variant, className }))}
        {...props}
      >
        {Icon ? <Icon /> : children}
      </div>
    );
  }
);
IconBadge.displayName = "IconBadge";

/**
 * Pre-configured icons for relationship categories
 * Maps category types to appropriate icons and variants
 */
export const relationshipCategoryConfig = {
  parents: {
    icon: Users,
    variant: "parents" as const,
    label: {
      en: "Parents",
      ru: "Родители",
    },
  },
  grandparents: {
    icon: Crown,
    variant: "grandparents" as const,
    label: {
      en: "Grandparents",
      ru: "Бабушки и Дедушки",
    },
  },
  children: {
    icon: Baby,
    variant: "children" as const,
    label: {
      en: "Children",
      ru: "Дети",
    },
  },
  grandchildren: {
    icon: Sparkles,
    variant: "grandchildren" as const,
    label: {
      en: "Grandchildren",
      ru: "Внуки",
    },
  },
  siblings: {
    icon: Users2,
    variant: "siblings" as const,
    label: {
      en: "Siblings",
      ru: "Братья и Сёстры",
    },
  },
  spouses: {
    icon: Heart,
    variant: "spouses" as const,
    label: {
      en: "Spouses",
      ru: "Супруги",
    },
  },
  extended: {
    icon: Network,
    variant: "extended" as const,
    label: {
      en: "Extended Family",
      ru: "Дальние родственники",
    },
  },
};

/**
 * CategoryBadge - Pre-configured badge for relationship categories
 */
export interface CategoryBadgeProps
  extends Omit<IconBadgeProps, "icon" | "variant"> {
  category: keyof typeof relationshipCategoryConfig;
}

const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ category, size = "lg", ...props }, ref) => {
    const config = relationshipCategoryConfig[category];
    return (
      <IconBadge
        ref={ref}
        icon={config.icon}
        variant={config.variant}
        size={size}
        {...props}
      />
    );
  }
);
CategoryBadge.displayName = "CategoryBadge";

export { IconBadge, CategoryBadge, iconBadgeVariants };
