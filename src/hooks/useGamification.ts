"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GamificationStats,
  LeaderboardEntry,
  ChallengeWithProgress,
  LeaderboardPeriod,
} from "@/lib/gamification/types";

interface UseGamificationResult {
  stats: GamificationStats | null;
  leaderboard: LeaderboardEntry[];
  challenges: ChallengeWithProgress[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshLeaderboard: (period?: LeaderboardPeriod) => Promise<void>;
  refreshChallenges: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
}

const defaultStats: GamificationStats = {
  current_streak: 0,
  longest_streak: 0,
  total_points: 0,
  weekly_points: 0,
  monthly_points: 0,
  rank_in_family: 0,
  total_family_members: 0,
  badges_earned: 0,
  challenges_completed: 0,
  active_challenges: 0,
};

/**
 * Hook for fetching and managing gamification data on the client
 */
export function useGamification(): UseGamificationResult {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch("/api/gamification/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("[useGamification] Stats error:", err);
      setStats(defaultStats);
    }
  }, []);

  const refreshLeaderboard = useCallback(
    async (period: LeaderboardPeriod = "all") => {
      try {
        const response = await fetch(
          `/api/gamification/leaderboard?period=${period}`
        );
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error("[useGamification] Leaderboard error:", err);
        setLeaderboard([]);
      }
    },
    []
  );

  const refreshChallenges = useCallback(async () => {
    try {
      const response = await fetch("/api/gamification/challenges");
      if (!response.ok) throw new Error("Failed to fetch challenges");
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (err) {
      console.error("[useGamification] Challenges error:", err);
      setChallenges([]);
    }
  }, []);

  const joinChallenge = useCallback(async (challengeId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/gamification/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action: "join" }),
      });

      if (!response.ok) return false;

      // Update local state
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? { ...c, is_joined: true } : c))
      );

      return true;
    } catch (err) {
      console.error("[useGamification] Join challenge error:", err);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          refreshStats(),
          refreshLeaderboard(),
          refreshChallenges(),
        ]);
      } catch (err) {
        setError("Failed to load gamification data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [refreshStats, refreshLeaderboard, refreshChallenges]);

  return {
    stats,
    leaderboard,
    challenges,
    loading,
    error,
    refreshStats,
    refreshLeaderboard,
    refreshChallenges,
    joinChallenge,
  };
}

export default useGamification;
