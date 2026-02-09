"use client";

import * as React from "react";
import { useState, useCallback } from "react";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        {/* Header - Compact glass card */}
        <div className="bg-card/80 backdrop-blur-md border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">{t.subtitle}</p>
        </div>

        {/* Stats Overview */}
        <GamificationStatsCard stats={stats} totalBadges={badges.length} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-[#161B22] border border-[#30363D] backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.tabOverview}
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Award className="w-3.5 h-3.5" />
              {t.tabBadges}
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Target className="w-3.5 h-3.5" />
              {t.tabChallenges}
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Crown className="w-3.5 h-3.5" />
              {t.tabLeaderboard}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Streak */}
              <GlassCard glass="subtle" padding="md">
                <GlassCardHeader className="pb-3">
                  <GlassCardTitle className="flex items-center gap-2 text-base">
                    <Flame className="w-4 h-4 text-[#D29922]" />
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
                <GlassCardHeader className="pb-3">
                  <GlassCardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-4 h-4 text-primary" />
                    {t.challengesTitle}
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
          <TabsContent value="challenges" className="space-y-3">
            {challenges.length === 0 ? (
              <GlassCard glass="subtle" padding="lg">
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t.noChallenges}</p>
                </div>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
