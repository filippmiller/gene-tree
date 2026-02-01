"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Flame, Snowflake, Star, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakWidgetProps {
  currentStreak: number;
  totalPoints: number;
  isActiveToday: boolean;
  daysUntilLost: number;
  isFrozen?: boolean;
  locale?: string;
  showPoints?: boolean;
  linkToAchievements?: boolean;
  className?: string;
}

/**
 * Compact streak widget for navigation bar or dashboard
 */
export function StreakWidget({
  currentStreak,
  totalPoints,
  isActiveToday,
  daysUntilLost,
  isFrozen = false,
  locale: propLocale,
  showPoints = true,
  linkToAchievements = true,
  className,
}: StreakWidgetProps) {
  const intlLocale = useLocale();
  const locale = (propLocale || intlLocale) as "en" | "ru";

  const t = {
    streak: locale === "ru" ? "дней" : "days",
    points: locale === "ru" ? "очков" : "pts",
    warning: locale === "ru" ? "Продолжите серию!" : "Keep your streak!",
    frozen: locale === "ru" ? "Заморожено" : "Frozen",
    active: locale === "ru" ? "Активно" : "Active",
    viewAll: locale === "ru" ? "Все достижения" : "View achievements",
  };

  const getStreakColor = () => {
    if (isFrozen) return "text-blue-400";
    if (currentStreak >= 30) return "text-orange-500";
    if (currentStreak >= 7) return "text-amber-500";
    return "text-gray-400";
  };

  const needsWarning = !isActiveToday && daysUntilLost === 1 && !isFrozen;

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
        "border border-white/30 dark:border-white/10",
        "transition-all duration-200 hover:bg-white/70 dark:hover:bg-gray-700/70",
        needsWarning && "animate-pulse ring-2 ring-red-500/50",
        className
      )}
    >
      {/* Streak */}
      <div className="flex items-center gap-1">
        {isFrozen ? (
          <Snowflake className="w-4 h-4 text-blue-400" />
        ) : (
          <Flame className={cn("w-4 h-4", getStreakColor())} />
        )}
        <span className={cn("font-semibold text-sm", getStreakColor())}>
          {currentStreak}
        </span>
        {needsWarning && (
          <AlertTriangle className="w-3 h-3 text-red-500" />
        )}
      </div>

      {/* Divider */}
      {showPoints && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

          {/* Points */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
            <span className="font-semibold text-sm text-violet-500">
              {totalPoints >= 1000
                ? `${(totalPoints / 1000).toFixed(1)}k`
                : totalPoints}
            </span>
          </div>
        </>
      )}
    </div>
  );

  const wrappedContent = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {linkToAchievements ? (
            <Link href={`/${locale}/achievements`} className="block">
              {content}
            </Link>
          ) : (
            content
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1 text-sm">
            <p>
              {currentStreak} {t.streak}{" "}
              {isFrozen ? `(${t.frozen})` : isActiveToday ? `(${t.active})` : ""}
            </p>
            {showPoints && (
              <p>
                {totalPoints.toLocaleString()} {t.points}
              </p>
            )}
            {needsWarning && (
              <p className="text-red-400">{t.warning}</p>
            )}
            <p className="text-xs text-muted-foreground">{t.viewAll}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return wrappedContent;
}

export default StreakWidget;
