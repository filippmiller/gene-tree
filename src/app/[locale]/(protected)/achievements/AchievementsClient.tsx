"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Flame,
  Target,
  Crown,
  Award,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { BadgeGrid } from "@/components/badges/BadgeGrid";
import { BadgeUnlockCelebration } from "@/components/badges/BadgeUnlockCelebration";
import type { BadgeData } from "@/components/badges/BadgeCard";
import {
  GamificationStatsCard,
  StreakDisplay,
  ChallengeCard,
  Leaderboard,
} from "@/components/gamification";
import type {
  GamificationStats,
  LeaderboardEntry,
  ChallengeWithProgress,
  LeaderboardPeriod,
} from "@/lib/gamification/types";

interface AchievementsClientProps {
  locale: string;
  userId: string;
  badges: BadgeData[];
  stats: GamificationStats;
  leaderboard: LeaderboardEntry[];
  challenges: ChallengeWithProgress[];
}

export function AchievementsClient({
  locale,
  userId,
  badges: initialBadges,
  stats: initialStats,
  leaderboard: initialLeaderboard,
  challenges: initialChallenges,
}: AchievementsClientProps) {
  const [badges] = useState(initialBadges);
  const [stats] = useState(initialStats);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [challenges, setChallenges] = useState(initialChallenges);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [celebrationBadge, setCelebrationBadge] = useState<BadgeData | null>(null);

  const t = locale === "ru"
    ? {
        title: "Достижения",
        subtitle: "Ваш путь исследователя семейной истории",
        tabOverview: "Обзор",
        tabBadges: "Значки",
        tabChallenges: "Испытания",
        tabLeaderboard: "Лидеры",
        streakTitle: "Ваша серия",
        challengesTitle: "Активные испытания",
        noChallenges: "Нет активных испытаний. Скоро появятся новые!",
        joinSuccess: "Вы присоединились к испытанию!",
        claimSuccess: "Награда получена!",
      }
    : {
        title: "Achievements",
        subtitle: "Your family research journey",
        tabOverview: "Overview",
        tabBadges: "Badges",
        tabChallenges: "Challenges",
        tabLeaderboard: "Leaderboard",
        streakTitle: "Your Streak",
        challengesTitle: "Active Challenges",
        noChallenges: "No active challenges. New ones coming soon!",
        joinSuccess: "You joined the challenge!",
        claimSuccess: "Reward claimed!",
      };

  // Handle leaderboard period change
  const handlePeriodChange = useCallback(async (period: LeaderboardPeriod) => {
    setLeaderboardPeriod(period);
    setLeaderboardLoading(true);

    try {
      const response = await fetch(
        `/api/gamification/leaderboard?period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Handle joining a challenge
  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    try {
      const response = await fetch("/api/gamification/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action: "join" }),
      });

      if (response.ok) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId ? { ...c, is_joined: true } : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to join challenge:", error);
    }
  }, []);

  // Handle claiming a challenge reward
  const handleClaimReward = useCallback(async (challengeId: string) => {
    try {
      const response = await fetch("/api/gamification/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action: "claim" }),
      });

      if (response.ok) {
        // Refresh challenges list
        const challengesResponse = await fetch("/api/gamification/challenges");
        if (challengesResponse.ok) {
          const data = await challengesResponse.json();
          setChallenges(data.challenges);
        }
      }
    } catch (error) {
      console.error("Failed to claim reward:", error);
    }
  }, []);

  // Calculate streak display data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isActiveToday = stats.current_streak > 0; // Simplified check
  const daysUntilLost = isActiveToday ? 2 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-amber-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <GlassCard glass="frosted" padding="none" className="overflow-hidden">
          <div className="relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-amber-500" />
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative p-6 sm:p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8" />
                <h1 className="text-3xl font-bold">{t.title}</h1>
              </div>
              <p className="text-white/80 max-w-lg">{t.subtitle}</p>
            </div>
          </div>
        </GlassCard>

        {/* Stats Overview */}
        <GamificationStatsCard stats={stats} totalBadges={badges.length} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4" />
              {t.tabOverview}
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Award className="w-4 h-4" />
              {t.tabBadges}
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4" />
              {t.tabChallenges}
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white"
            >
              <Crown className="w-4 h-4" />
              {t.tabLeaderboard}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Streak */}
              <GlassCard glass="subtle" padding="md">
                <GlassCardHeader className="pb-4">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {t.streakTitle}
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="flex justify-center">
                  <StreakDisplay
                    currentStreak={stats.current_streak}
                    longestStreak={stats.longest_streak}
                    isActiveToday={isActiveToday}
                    daysUntilLost={daysUntilLost}
                    isFrozen={false}
                  />
                </GlassCardContent>
              </GlassCard>

              {/* Mini Leaderboard */}
              <div className="lg:col-span-2">
                <Leaderboard
                  entries={leaderboard.slice(0, 5)}
                  currentUserId={userId}
                  period={leaderboardPeriod}
                />
              </div>
            </div>

            {/* Active Challenges Preview */}
            {challenges.length > 0 && (
              <GlassCard glass="subtle" padding="md">
                <GlassCardHeader className="pb-4">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    {t.challengesTitle}
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challenges.slice(0, 3).map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        id={challenge.id}
                        title={challenge.title}
                        titleRu={challenge.title_ru}
                        description={challenge.description}
                        descriptionRu={challenge.description_ru}
                        challengeType={challenge.challenge_type}
                        targetValue={challenge.target_value}
                        currentProgress={challenge.current_progress}
                        rewardPoints={challenge.reward_points}
                        daysRemaining={challenge.days_remaining}
                        isJoined={challenge.is_joined}
                        isCompleted={challenge.is_completed}
                        participantCount={challenge.participant_count}
                        onJoin={handleJoinChallenge}
                        onClaim={handleClaimReward}
                      />
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Recent Badges */}
            <BadgeGrid
              badges={badges.filter((b) => b.earned).slice(0, 5)}
              showCategories={false}
            />
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <BadgeGrid badges={badges} showCategories showProgress />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            {challenges.length === 0 ? (
              <GlassCard glass="subtle" padding="lg">
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t.noChallenges}</p>
                </div>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    title={challenge.title}
                    titleRu={challenge.title_ru}
                    description={challenge.description}
                    descriptionRu={challenge.description_ru}
                    challengeType={challenge.challenge_type}
                    targetValue={challenge.target_value}
                    currentProgress={challenge.current_progress}
                    rewardPoints={challenge.reward_points}
                    daysRemaining={challenge.days_remaining}
                    isJoined={challenge.is_joined}
                    isCompleted={challenge.is_completed}
                    participantCount={challenge.participant_count}
                    onJoin={handleJoinChallenge}
                    onClaim={handleClaimReward}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Leaderboard
              entries={leaderboard}
              currentUserId={userId}
              period={leaderboardPeriod}
              onPeriodChange={handlePeriodChange}
              loading={leaderboardLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Badge Celebration Modal */}
      {celebrationBadge && (
        <BadgeUnlockCelebration
          badge={celebrationBadge}
          isOpen={!!celebrationBadge}
          onClose={() => setCelebrationBadge(null)}
        />
      )}
    </div>
  );
}
