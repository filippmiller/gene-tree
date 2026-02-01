"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Flame, Snowflake, AlertTriangle, Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  daysUntilLost: number;
  isFrozen?: boolean;
  compact?: boolean;
  showLongest?: boolean;
  className?: string;
}

/**
 * Displays user's activity streak with visual indicators
 */
export function StreakDisplay({
  currentStreak,
  longestStreak,
  isActiveToday,
  daysUntilLost,
  isFrozen = false,
  compact = false,
  showLongest = true,
  className,
}: StreakDisplayProps) {
  const locale = useLocale() as "en" | "ru";

  const t = {
    streak: locale === "ru" ? "дней подряд" : "day streak",
    streakSingular: locale === "ru" ? "день подряд" : "day streak",
    longest: locale === "ru" ? "Лучший:" : "Best:",
    frozen: locale === "ru" ? "Серия заморожена" : "Streak frozen",
    warning: locale === "ru" ? "Активируйтесь сегодня!" : "Be active today!",
    safe: locale === "ru" ? "Вы активны сегодня" : "You're active today",
    newRecord: locale === "ru" ? "Новый рекорд!" : "New record!",
  };

  const getStreakColor = () => {
    if (isFrozen) return "text-blue-400";
    if (currentStreak >= 30) return "text-orange-500";
    if (currentStreak >= 7) return "text-amber-500";
    if (currentStreak >= 3) return "text-yellow-500";
    return "text-gray-400";
  };

  const getBackgroundColor = () => {
    if (isFrozen) return "bg-blue-500/10";
    if (currentStreak >= 30) return "bg-orange-500/10";
    if (currentStreak >= 7) return "bg-amber-500/10";
    if (currentStreak >= 3) return "bg-yellow-500/10";
    return "bg-gray-500/10";
  };

  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                getBackgroundColor(),
                className
              )}
            >
              {isFrozen ? (
                <Snowflake className={cn("w-4 h-4", getStreakColor())} />
              ) : (
                <Flame className={cn("w-4 h-4", getStreakColor())} />
              )}
              <span className={cn("font-semibold", getStreakColor())}>
                {currentStreak}
              </span>
              {!isActiveToday && daysUntilLost === 1 && !isFrozen && (
                <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                {currentStreak}{" "}
                {currentStreak === 1 ? t.streakSingular : t.streak}
              </p>
              {showLongest && (
                <p className="text-xs text-muted-foreground">
                  {t.longest} {longestStreak}
                </p>
              )}
              {!isActiveToday && daysUntilLost === 1 && !isFrozen && (
                <p className="text-xs text-red-400">{t.warning}</p>
              )}
              {isFrozen && <p className="text-xs text-blue-400">{t.frozen}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center p-4 rounded-2xl",
        getBackgroundColor(),
        "backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Flame icon */}
      <div className="relative mb-2">
        {isFrozen ? (
          <Snowflake className={cn("w-12 h-12", getStreakColor())} />
        ) : (
          <Flame
            className={cn(
              "w-12 h-12",
              getStreakColor(),
              currentStreak > 0 && "animate-pulse"
            )}
          />
        )}
        {isNewRecord && currentStreak > 1 && (
          <Trophy className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
        )}
      </div>

      {/* Streak count */}
      <div className="text-center">
        <span className={cn("text-4xl font-bold", getStreakColor())}>
          {currentStreak}
        </span>
        <p className="text-sm text-muted-foreground mt-1">
          {currentStreak === 1 ? t.streakSingular : t.streak}
        </p>
      </div>

      {/* Longest streak */}
      {showLongest && (
        <p className="text-xs text-muted-foreground mt-2">
          {t.longest} {longestStreak}
          {isNewRecord && currentStreak > 1 && (
            <span className="ml-1 text-amber-400">{t.newRecord}</span>
          )}
        </p>
      )}

      {/* Status indicator */}
      <div className="mt-3">
        {isFrozen ? (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
            {t.frozen}
          </span>
        ) : isActiveToday ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            {t.safe}
          </span>
        ) : daysUntilLost === 1 ? (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 animate-pulse">
            {t.warning}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default StreakDisplay;
