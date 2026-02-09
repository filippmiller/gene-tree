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

    // Count badge colors based on variant (Midnight Glass palette)
    const countBadgeColors: Record<string, string> = {
      parents: "bg-[#58A6FF]/10 text-[#58A6FF]",
      grandparents: "bg-[#3FB9A0]/10 text-[#3FB9A0]",
      children: "bg-[#56D4DD]/10 text-[#56D4DD]",
      grandchildren: "bg-[#8B8FFF]/10 text-[#8B8FFF]",
      siblings: "bg-[#3FB950]/10 text-[#3FB950]",
      spouses: "bg-[#F778BA]/10 text-[#F778BA]",
      extended: "bg-[#8B949E]/10 text-[#8B949E]",
      default: "bg-[#58A6FF]/10 text-[#58A6FF]",
      success: "bg-[#3FB950]/10 text-[#3FB950]",
      warning: "bg-[#D29922]/10 text-[#D29922]",
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
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#58A6FF] shadow-lg shadow-[#58A6FF]/25 text-white">
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
              <div className="bg-[#272D36]/50 rounded-2xl p-8 text-center">
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
