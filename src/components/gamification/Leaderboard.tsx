"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Crown, Medal, Award, Flame, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  current_streak: number;
  badge_count: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  period?: "all" | "weekly" | "monthly";
  onPeriodChange?: (period: "all" | "weekly" | "monthly") => void;
  loading?: boolean;
  className?: string;
}

const rankIcons = [Crown, Medal, Award];
const rankColors = [
  "text-[#D29922]",
  "text-gray-400",
  "text-[#D29922]/70",
];

/**
 * Family leaderboard component showing rankings
 */
export function Leaderboard({
  entries,
  currentUserId,
  period = "all",
  onPeriodChange,
  loading = false,
  className,
}: LeaderboardProps) {
  const locale = useLocale() as "en" | "ru";

  const t = {
    title: locale === "ru" ? "Лидеры Семьи" : "Family Leaderboard",
    all: locale === "ru" ? "Все время" : "All time",
    weekly: locale === "ru" ? "Неделя" : "Weekly",
    monthly: locale === "ru" ? "Месяц" : "Monthly",
    points: locale === "ru" ? "очков" : "pts",
    streak: locale === "ru" ? "дней" : "days",
    badges: locale === "ru" ? "значков" : "badges",
    noData: locale === "ru" ? "Пока нет данных" : "No data yet",
    you: locale === "ru" ? "(Вы)" : "(You)",
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderEntry = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = entry.user_id === currentUserId;
    const RankIcon = entry.rank <= 3 ? rankIcons[entry.rank - 1] : null;
    const rankColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : "";

    return (
      <div
        key={entry.user_id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-colors",
          isCurrentUser
            ? "bg-[#58A6FF]/10 ring-1 ring-[#58A6FF]/30"
            : "hover:bg-white/5",
          index === 0 && "bg-[#D29922]/10"
        )}
      >
        {/* Rank */}
        <div className="w-8 flex justify-center">
          {RankIcon ? (
            <RankIcon className={cn("w-6 h-6", rankColor)} />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {entry.rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(entry.display_name)}
          </AvatarFallback>
        </Avatar>

        {/* Name and stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium truncate", isCurrentUser && "text-[#58A6FF]")}>
              {entry.display_name}
            </span>
            {isCurrentUser && (
              <span className="text-xs text-[#58A6FF]">{t.you}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              {entry.current_streak} {t.streak}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-[#58A6FF]" />
              {entry.badge_count} {t.badges}
            </span>
          </div>
        </div>

        {/* Points */}
        <div className="text-right">
          <div className="flex items-center gap-1 font-bold text-[#58A6FF]">
            <Star className="w-4 h-4 fill-[#58A6FF]" />
            {entry.points.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground">{t.points}</span>
        </div>
      </div>
    );
  };

  return (
    <GlassCard glass="frosted" padding="none" className={className}>
      <GlassCardHeader className="p-4 pb-0">
        <GlassCardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#D29922]" />
          {t.title}
        </GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent className="p-4">
        {/* Period tabs */}
        {onPeriodChange && (
          <Tabs
            value={period}
            onValueChange={(v) => onPeriodChange(v as "all" | "weekly" | "monthly")}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t.all}</TabsTrigger>
              <TabsTrigger value="weekly">{t.weekly}</TabsTrigger>
              <TabsTrigger value="monthly">{t.monthly}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Leaderboard list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noData}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => renderEntry(entry, index))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

export default Leaderboard;
