"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalPoints: number;
  weeklyPoints: number;
  isActiveToday: boolean;
  daysUntilLost: number;
  isFrozen: boolean;
}

interface UseStreakResult {
  streak: StreakData | null;
  loading: boolean;
  error: string | null;
  recordActivity: (actionType: string) => Promise<{ points: number; streakIncreased: boolean } | null>;
  refreshStreak: () => Promise<void>;
}

/**
 * Hook for tracking and managing user streaks
 * Provides current streak status and activity recording
 */
export function useStreak(userId: string | null): UseStreakResult {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const calculateStreakStatus = useCallback((data: {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    total_points: number;
    weekly_points: number;
    streak_frozen_until: string | null;
  }): StreakData => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isActiveToday = false;
    let daysUntilLost = 0;

    if (data.last_activity_date) {
      const lastActivity = new Date(data.last_activity_date);
      lastActivity.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        isActiveToday = true;
        daysUntilLost = 2;
      } else if (diffDays === 1) {
        isActiveToday = false;
        daysUntilLost = 1;
      }
    }

    const isFrozen = data.streak_frozen_until
      ? new Date(data.streak_frozen_until) >= today
      : false;

    if (isFrozen && data.streak_frozen_until) {
      daysUntilLost = Math.ceil(
        (new Date(data.streak_frozen_until).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    return {
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastActivityDate: data.last_activity_date,
      totalPoints: data.total_points,
      weeklyPoints: data.weekly_points,
      isActiveToday,
      daysUntilLost,
      isFrozen,
    };
  }, []);

  const fetchStreak = useCallback(async () => {
    if (!userId) {
      setStreak(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (!data) {
        // No streak record yet
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalPoints: 0,
          weeklyPoints: 0,
          isActiveToday: false,
          daysUntilLost: 0,
          isFrozen: false,
        });
      } else {
        setStreak(calculateStreakStatus(data));
      }
    } catch (err) {
      console.error("[useStreak] Error fetching streak:", err);
      setError("Failed to load streak data");
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, calculateStreakStatus]);

  const recordActivity = useCallback(
    async (
      actionType: string
    ): Promise<{ points: number; streakIncreased: boolean } | null> => {
      if (!userId) return null;

      try {
        // Call API to record activity (server-side)
        const response = await fetch("/api/gamification/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionType }),
        });

        if (!response.ok) {
          throw new Error("Failed to record activity");
        }

        const result = await response.json();

        // Refresh streak data
        await fetchStreak();

        return {
          points: result.points_earned,
          streakIncreased: result.streak_increased,
        };
      } catch (err) {
        console.error("[useStreak] Error recording activity:", err);
        return null;
      }
    },
    [userId, fetchStreak]
  );

  // Initial fetch
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`streak-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_streaks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setStreak(calculateStreakStatus(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, calculateStreakStatus]);

  return {
    streak,
    loading,
    error,
    recordActivity,
    refreshStreak: fetchStreak,
  };
}

export default useStreak;
