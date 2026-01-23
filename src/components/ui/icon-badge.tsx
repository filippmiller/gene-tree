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
  User,
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
    "shadow-lg",
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
        // Parents - Violet
        parents: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25 text-white",
        // Grandparents - Amber/Gold (wisdom, heritage)
        grandparents: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25 text-white",
        // Children - Sky blue (youth, future)
        children: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/25 text-white",
        // Grandchildren - Pink/Rose (joy, new life)
        grandchildren: "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/25 text-white",
        // Siblings - Emerald/Teal (connection, equality)
        siblings: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25 text-white",
        // Spouses - Red/Rose (love)
        spouses: "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25 text-white",
        // Extended family - Indigo
        extended: "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/25 text-white",
        // Default - Primary violet
        default: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25 text-white",
        // Neutral - Gray
        neutral: "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/25 text-white",
        // Success - Green
        success: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25 text-white",
        // Warning - Amber
        warning: "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/25 text-white",
        // Outline - No fill, just border
        outline: "bg-white/80 border-2 border-violet-200 text-violet-600 shadow-none",
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
