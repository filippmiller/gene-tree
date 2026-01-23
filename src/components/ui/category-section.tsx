"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconBadge, relationshipCategoryConfig } from "./icon-badge";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * CategorySection - Modern section header with icon badge
 *
 * Replaces emoji-based section headers with professional design.
 * Features:
 * - Gradient icon badge
 * - Title and description
 * - Count badge
 * - Optional collapse functionality
 */

export interface CategorySectionProps extends React.HTMLAttributes<HTMLElement> {
  category?: keyof typeof relationshipCategoryConfig;
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  count?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  emptyMessage?: string;
  iconVariant?: "parents" | "grandparents" | "children" | "grandchildren" | "siblings" | "spouses" | "extended" | "default" | "success" | "warning";
}

const CategorySection = React.forwardRef<HTMLElement, CategorySectionProps>(
  (
    {
      className,
      category,
      customIcon,
      title,
      description,
      count = 0,
      collapsible = false,
      defaultCollapsed = false,
      emptyMessage,
      iconVariant,
      children,
      ...props
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    // Get category config if provided
    const categoryConfig = category ? relationshipCategoryConfig[category] : null;
    const variant = iconVariant || categoryConfig?.variant || "default";

    // Count badge colors based on variant
    const countBadgeColors: Record<string, string> = {
      parents: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
      grandparents: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      children: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
      grandchildren: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
      siblings: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      spouses: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
      extended: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
      default: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
      success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    };

    return (
      <section ref={ref} className={cn("mb-8", className)} {...props}>
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-4 mb-4",
            collapsible && "cursor-pointer select-none"
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          role={collapsible ? "button" : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
        >
          {/* Icon Badge */}
          {customIcon ? (
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 text-white">
              {customIcon}
            </div>
          ) : categoryConfig ? (
            <IconBadge
              icon={categoryConfig.icon}
              variant={variant}
              size="lg"
            />
          ) : (
            <IconBadge variant={variant} size="lg" />
          )}

          {/* Title + Description */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Count Badge */}
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              countBadgeColors[variant]
            )}
          >
            {count}
          </div>

          {/* Collapse indicator */}
          {collapsible && (
            <div className="text-muted-foreground">
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {!isCollapsed && (
          <>
            {count === 0 && emptyMessage ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-8 text-center">
                <p className="text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : (
              children
            )}
          </>
        )}
      </section>
    );
  }
);
CategorySection.displayName = "CategorySection";

export { CategorySection };
