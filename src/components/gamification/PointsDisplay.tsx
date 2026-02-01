"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PointsDisplayProps {
  totalPoints: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  rank?: number;
  totalMembers?: number;
  previousRank?: number;
  compact?: boolean;
  showTrend?: boolean;
  className?: string;
}

/**
 * Displays user's points with optional ranking and trends
 */
export function PointsDisplay({
  totalPoints,
  weeklyPoints,
  monthlyPoints,
  rank,
  totalMembers,
  previousRank,
  compact = false,
  showTrend = true,
  className,
}: PointsDisplayProps) {
  const locale = useLocale() as "en" | "ru";

  const t = {
    points: locale === "ru" ? "очков" : "points",
    total: locale === "ru" ? "Всего" : "Total",
    weekly: locale === "ru" ? "На этой неделе" : "This week",
    monthly: locale === "ru" ? "В этом месяце" : "This month",
    rank: locale === "ru" ? "Место" : "Rank",
    of: locale === "ru" ? "из" : "of",
  };

  const formatPoints = (points: number): string => {
    if (points >= 10000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toLocaleString();
  };

  const getRankTrend = () => {
    if (!previousRank || !rank) return null;
    if (rank < previousRank) return "up";
    if (rank > previousRank) return "down";
    return "same";
  };

  const rankTrend = getRankTrend();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-violet-500/10",
                className
              )}
            >
              <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
              <span className="font-semibold text-violet-500">
                {formatPoints(totalPoints)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                {totalPoints.toLocaleString()} {t.points}
              </p>
              {weeklyPoints !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {t.weekly}: +{weeklyPoints}
                </p>
              )}
              {rank && totalMembers && (
                <p className="text-xs text-muted-foreground">
                  {t.rank}: #{rank} {t.of} {totalMembers}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-2xl",
        "bg-violet-500/10 backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Main points */}
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-8 h-8 text-violet-500 fill-violet-500" />
        <div>
          <span className="text-3xl font-bold text-violet-500">
            {formatPoints(totalPoints)}
          </span>
          <p className="text-xs text-muted-foreground">{t.points}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        {weeklyPoints !== undefined && (
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-muted-foreground text-xs">{t.weekly}</p>
            <p className="font-semibold text-green-500">+{weeklyPoints}</p>
          </div>
        )}
        {monthlyPoints !== undefined && (
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-muted-foreground text-xs">{t.monthly}</p>
            <p className="font-semibold text-blue-500">+{monthlyPoints}</p>
          </div>
        )}
      </div>

      {/* Rank */}
      {rank && totalMembers && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div>
            <p className="text-xs text-muted-foreground">{t.rank}</p>
            <p className="font-semibold">
              #{rank}{" "}
              <span className="text-muted-foreground text-xs">
                {t.of} {totalMembers}
              </span>
            </p>
          </div>
          {showTrend && rankTrend && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                rankTrend === "up" &&
                  "bg-green-500/20 text-green-500",
                rankTrend === "down" &&
                  "bg-red-500/20 text-red-500",
                rankTrend === "same" &&
                  "bg-gray-500/20 text-gray-500"
              )}
            >
              {rankTrend === "up" && (
                <>
                  <TrendingUp className="w-3 h-3" />
                  <span>+{previousRank! - rank}</span>
                </>
              )}
              {rankTrend === "down" && (
                <>
                  <TrendingDown className="w-3 h-3" />
                  <span>-{rank - previousRank!}</span>
                </>
              )}
              {rankTrend === "same" && <Minus className="w-3 h-3" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PointsDisplay;
