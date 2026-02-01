"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ChevronRight, Award } from "lucide-react";
import { BadgeCard, type BadgeData } from "./BadgeCard";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export interface ProfileBadgesProps extends React.HTMLAttributes<HTMLDivElement> {
  userId: string;
  badges: BadgeData[];
  featured?: BadgeData[];
  stats?: {
    total_earned: number;
    total_available: number;
    by_category?: Record<string, { earned: number; total: number }>;
  };
  isOwnProfile?: boolean;
}

/**
 * Badge section for user profiles
 * Shows featured badges prominently, with link to full badge page
 */
export function ProfileBadges({
  userId,
  badges,
  featured = [],
  stats,
  isOwnProfile = false,
  className,
  ...props
}: ProfileBadgesProps) {
  const locale = useLocale() as "en" | "ru";

  const earnedCount = stats?.total_earned ?? badges.filter((b) => b.earned).length;
  const totalCount = stats?.total_available ?? badges.length;

  // Get featured badges or most recent earned
  const displayBadges =
    featured.length > 0
      ? featured.slice(0, 5)
      : badges
          .filter((b) => b.earned)
          .sort(
            (a, b) =>
              new Date(b.earned_at || 0).getTime() -
              new Date(a.earned_at || 0).getTime()
          )
          .slice(0, 5);

  return (
    <GlassCard glass="subtle" className={cn("", className)} {...props}>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-500" />
            {locale === "ru" ? "Достижения" : "Achievements"}
          </GlassCardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {earnedCount} / {totalCount}
            </span>
            <Link href={`/achievements`}>
              <Button variant="ghost" size="sm">
                {locale === "ru" ? "Все" : "View All"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent>
        {displayBadges.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {displayBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={true}
                size="sm"
                showProgress={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isOwnProfile
                ? locale === "ru"
                  ? "Пока нет значков. Начните строить свое древо!"
                  : "No badges yet. Start building your tree!"
                : locale === "ru"
                ? "Пока нет значков"
                : "No badges yet"}
            </p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
