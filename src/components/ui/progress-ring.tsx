"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCompletenessColor, type ProfileCompletenessCategory } from "@/lib/profile-completeness";

/**
 * Profile Completeness Progress Ring
 *
 * A circular progress indicator that shows profile completion percentage
 * with color-coded feedback and tooltip showing missing items.
 *
 * Features:
 * - SVG-based circular progress with smooth animation
 * - Color gradient: red (0-40%), yellow (40-70%), green (70-100%)
 * - Animated on mount
 * - Tooltip showing what's missing
 * - Mobile-friendly sizing
 */

interface ProgressRingProps {
  /** Percentage value (0-100) */
  value: number;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show percentage text in center */
  showValue?: boolean;
  /** Show percentage label below */
  showLabel?: boolean;
  /** Label text (defaults to "Complete") */
  label?: string;
  /** List of missing items for tooltip */
  missingItems?: ProfileCompletenessCategory[];
  /** Locale for translations */
  locale?: "en" | "ru";
  /** Additional class names */
  className?: string;
  /** Disable animation */
  disableAnimation?: boolean;
}

const sizeConfig = {
  sm: { dimension: 40, strokeWidth: 4, fontSize: "text-xs", labelSize: "text-[10px]" },
  md: { dimension: 64, strokeWidth: 5, fontSize: "text-sm", labelSize: "text-xs" },
  lg: { dimension: 96, strokeWidth: 6, fontSize: "text-lg", labelSize: "text-sm" },
  xl: { dimension: 128, strokeWidth: 8, fontSize: "text-2xl", labelSize: "text-base" },
};

const colorConfig = {
  error: {
    stroke: "stroke-red-500",
    text: "text-red-600 dark:text-red-400",
    gradient: { start: "#ef4444", end: "#dc2626" },
  },
  warning: {
    stroke: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    gradient: { start: "#f59e0b", end: "#d97706" },
  },
  success: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    gradient: { start: "#10b981", end: "#059669" },
  },
};

export function ProgressRing({
  value,
  size = "md",
  showValue = true,
  showLabel = false,
  label,
  missingItems = [],
  locale = "en",
  className,
  disableAnimation = false,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = React.useState(disableAnimation ? value : 0);
  const config = sizeConfig[size];
  const colorVariant = getCompletenessColor(value);
  const colors = colorConfig[colorVariant];

  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  // Unique ID for gradient
  const gradientId = React.useId();

  // Animate on mount
  React.useEffect(() => {
    if (disableAnimation) {
      setAnimatedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value, disableAnimation]);

  const translations = {
    en: {
      complete: "Complete",
      missingTitle: "To complete your profile:",
      allComplete: "Your profile is complete!",
    },
    ru: {
      complete: "Заполнено",
      missingTitle: "Для завершения профиля:",
      allComplete: "Ваш профиль заполнен!",
    },
  };

  const t = translations[locale];

  const ringContent = (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center",
        className
      )}
    >
      <svg
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        className="transform -rotate-90"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.gradient.start} />
            <stop offset="100%" stopColor={colors.gradient.end} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          strokeWidth={config.strokeWidth}
          fill="none"
          className="stroke-secondary"
        />

        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          strokeWidth={config.strokeWidth}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-1000 ease-out",
            !disableAnimation && "motion-safe:animate-[progress-ring_1s_ease-out]"
          )}
          style={{
            transformOrigin: "center",
          }}
        />
      </svg>

      {/* Center content */}
      {showValue && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            colors.text
          )}
        >
          <span className={cn("font-bold tabular-nums", config.fontSize)}>
            {Math.round(animatedValue)}%
          </span>
        </div>
      )}

      {/* Label below */}
      {showLabel && (
        <span
          className={cn(
            "mt-1 font-medium text-muted-foreground",
            config.labelSize
          )}
        >
          {label || t.complete}
        </span>
      )}
    </div>
  );

  // If no missing items, return ring without tooltip
  if (missingItems.length === 0 && value >= 100) {
    return ringContent;
  }

  // Wrap with tooltip showing missing items
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
          aria-label={`Profile ${Math.round(value)}% complete`}
        >
          {ringContent}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        variant="light"
        className="max-w-xs p-3"
      >
        {missingItems.length > 0 ? (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-sm">
              {t.missingTitle}
            </p>
            <ul className="space-y-1">
              {missingItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="text-amber-500 mt-0.5">-</span>
                  <span>
                    {locale === "ru" ? item.descriptionRu : item.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {t.allComplete}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compact variant for use in cards and lists
 */
interface CompactProgressRingProps {
  value: number;
  className?: string;
}

export function CompactProgressRing({
  value,
  className,
}: CompactProgressRingProps) {
  const colorVariant = getCompletenessColor(value);
  const colors = colorConfig[colorVariant];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-full",
        "bg-secondary/50",
        className
      )}
    >
      <ProgressRing
        value={value}
        size="sm"
        showValue={false}
        disableAnimation
      />
      <span className={cn("text-xs font-semibold tabular-nums", colors.text)}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

export type { ProgressRingProps, CompactProgressRingProps };
