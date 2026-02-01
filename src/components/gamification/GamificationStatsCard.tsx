"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  Flame,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";

interface GamificationStats {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  rank_in_family: number;
  total_family_members: number;
  badges_earned: number;
  challenges_completed: number;
  active_challenges: number;
}

interface GamificationStatsCardProps {
  stats: GamificationStats;
  totalBadges?: number;
  className?: string;
}

/**
 * Overview card displaying key gamification statistics
 */
export function GamificationStatsCard({
  stats,
  totalBadges = 17, // Default from seed
  className,
}: GamificationStatsCardProps) {
  const locale = useLocale() as "en" | "ru";

  const t = {
    streak: locale === "ru" ? "Серия" : "Streak",
    days: locale === "ru" ? "дней" : "days",
    points: locale === "ru" ? "Очки" : "Points",
    thisWeek: locale === "ru" ? "на этой неделе" : "this week",
    rank: locale === "ru" ? "Место" : "Rank",
    inFamily: locale === "ru" ? "в семье" : "in family",
    badges: locale === "ru" ? "Значки" : "Badges",
    earned: locale === "ru" ? "получено" : "earned",
    challenges: locale === "ru" ? "Испытания" : "Challenges",
    active: locale === "ru" ? "активных" : "active",
    completed: locale === "ru" ? "завершено" : "completed",
    best: locale === "ru" ? "Лучшая" : "Best",
  };

  const statItems = [
    {
      icon: Flame,
      label: t.streak,
      value: stats.current_streak,
      subLabel: t.days,
      subValue: `${t.best}: ${stats.longest_streak}`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Star,
      label: t.points,
      value: stats.total_points.toLocaleString(),
      subLabel: `+${stats.weekly_points} ${t.thisWeek}`,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Trophy,
      label: t.rank,
      value: `#${stats.rank_in_family || "-"}`,
      subLabel: `${t.inFamily} (${stats.total_family_members})`,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Award,
      label: t.badges,
      value: stats.badges_earned,
      subLabel: `${t.earned}`,
      subValue: `/ ${totalBadges}`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      progress: (stats.badges_earned / totalBadges) * 100,
    },
    {
      icon: Target,
      label: t.challenges,
      value: stats.challenges_completed,
      subLabel: t.completed,
      subValue: `${stats.active_challenges} ${t.active}`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <GlassCard glass="frosted" padding="none" className={className}>
      <GlassCardContent className="p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/10">
          {statItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "p-4 flex flex-col items-center justify-center text-center",
                index === statItems.length - 1 && "col-span-2 sm:col-span-1"
              )}
            >
              <div className={cn("p-2 rounded-xl mb-2", item.bgColor)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className={cn("text-2xl font-bold", item.color)}>
                {item.value}
                {item.subValue && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {item.subValue}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              {item.subLabel && (
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {item.subLabel}
                </div>
              )}
              {item.progress !== undefined && (
                <Progress
                  value={item.progress}
                  className="h-1 w-full mt-2 max-w-[80px]"
                />
              )}
            </div>
          ))}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

export default GamificationStatsCard;
