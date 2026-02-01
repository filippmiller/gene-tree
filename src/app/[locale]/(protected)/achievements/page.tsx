/**
 * Achievements Page
 * Displays user's gamification progress: badges, streaks, challenges, and leaderboard
 */

import { getSupabaseSSR } from "@/lib/supabase/server-ssr";
import { getSupabaseAdmin } from "@/lib/supabase/server-admin";
import { redirect } from "next/navigation";
import { AchievementsClient } from "./AchievementsClient";
import type { BadgeData } from "@/components/badges/BadgeCard";
import type { GamificationStats, LeaderboardEntry, ChallengeWithProgress } from "@/lib/gamification/types";

interface Props {
  params: Promise<{ locale: string }>;
}

// Type definitions for database rows (until migration is run and types regenerated)
interface BadgeRow {
  id: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_target: string | null;
  criteria_value: number | null;
  rarity: string;
  sort_order: number;
  is_active: boolean;
}

interface UserBadgeRow {
  badge_id: string;
  earned_at: string;
  is_featured: boolean;
}

interface BadgeProgressRow {
  badge_id: string;
  current_value: number;
}

async function getBadgesWithProgress(userId: string): Promise<BadgeData[]> {
  const supabase = getSupabaseAdmin();

  // Get all active badges - use type assertion since table may not be in generated types yet
  const { data: badges, error: badgesError } = await supabase
    .from("badges" as "user_profiles") // Type workaround
    .select("*")
    .eq("is_active", true)
    .order("sort_order") as unknown as { data: BadgeRow[] | null; error: Error | null };

  if (badgesError) {
    console.error("Failed to fetch badges:", badgesError);
    return [];
  }

  // Get user's earned badges
  const { data: userBadges, error: userBadgesError } = await supabase
    .from("user_badges" as "user_profiles")
    .select("badge_id, earned_at, is_featured")
    .eq("user_id", userId) as unknown as { data: UserBadgeRow[] | null; error: Error | null };

  if (userBadgesError) {
    console.error("Failed to fetch user badges:", userBadgesError);
  }

  // Get user's badge progress
  const { data: progress, error: progressError } = await supabase
    .from("badge_progress" as "user_profiles")
    .select("badge_id, current_value")
    .eq("user_id", userId) as unknown as { data: BadgeProgressRow[] | null; error: Error | null };

  if (progressError) {
    console.error("Failed to fetch badge progress:", progressError);
  }

  // Map earned badges
  const earnedMap = new Map(
    (userBadges || []).map((ub) => [
      ub.badge_id,
      { earned_at: ub.earned_at, is_featured: ub.is_featured },
    ])
  );

  // Map progress
  const progressMap = new Map(
    (progress || []).map((p) => [p.badge_id, p.current_value])
  );

  // Combine data
  return (badges || []).map((badge): BadgeData => ({
    id: badge.id,
    name: badge.name,
    name_ru: badge.name_ru,
    description: badge.description,
    description_ru: badge.description_ru,
    icon: badge.icon,
    category: badge.category,
    criteria_type: badge.criteria_type,
    criteria_target: badge.criteria_target,
    criteria_value: badge.criteria_value,
    rarity: badge.rarity as "common" | "rare" | "legendary",
    earned: earnedMap.has(badge.id),
    earned_at: earnedMap.get(badge.id)?.earned_at,
    progress: progressMap.get(badge.id) || 0,
    is_featured: earnedMap.get(badge.id)?.is_featured || false,
  }));
}

async function getGamificationStats(userId: string): Promise<GamificationStats> {
  const supabase = getSupabaseAdmin();

  try {
    // RPC call - will fail gracefully if function doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_user_gamification_stats", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Failed to get gamification stats:", error);
      return getDefaultStats();
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return getDefaultStats();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    return {
      current_streak: Number(r.current_streak ?? 0),
      longest_streak: Number(r.longest_streak ?? 0),
      total_points: Number(r.total_points ?? 0),
      weekly_points: Number(r.weekly_points ?? 0),
      monthly_points: Number(r.monthly_points ?? 0),
      rank_in_family: Number(r.rank_in_family ?? 0),
      total_family_members: Number(r.total_family_members ?? 0),
      badges_earned: Number(r.badges_earned ?? 0),
      challenges_completed: Number(r.challenges_completed ?? 0),
      active_challenges: Number(r.active_challenges ?? 0),
    };
  } catch {
    return getDefaultStats();
  }
}

function getDefaultStats(): GamificationStats {
  return {
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
}

async function getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_family_leaderboard", {
      p_user_id: userId,
      p_period: "all",
      p_limit: 10,
    });

    if (error) {
      console.error("Failed to get leaderboard:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((entry: Record<string, unknown>) => ({
      rank: Number(entry.rank),
      user_id: String(entry.user_id),
      display_name: String(entry.display_name),
      avatar_url: entry.avatar_url ? String(entry.avatar_url) : null,
      points: Number(entry.points),
      current_streak: Number(entry.current_streak),
      badge_count: Number(entry.badge_count),
    }));
  } catch {
    return [];
  }
}

async function getActiveChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_active_challenges", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Failed to get challenges:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((challenge: Record<string, unknown>) => ({
      id: String(challenge.challenge_id),
      title: String(challenge.title),
      title_ru: challenge.title_ru ? String(challenge.title_ru) : null,
      description: challenge.description ? String(challenge.description) : null,
      description_ru: challenge.description_ru
        ? String(challenge.description_ru)
        : null,
      challenge_type: String(challenge.challenge_type) as ChallengeWithProgress["challenge_type"],
      target_value: Number(challenge.target_value),
      current_progress: Number(challenge.current_progress),
      reward_points: Number(challenge.reward_points),
      reward_badge_id: challenge.reward_badge_id
        ? String(challenge.reward_badge_id)
        : null,
      start_date: String(challenge.start_date),
      end_date: String(challenge.end_date),
      days_remaining: Number(challenge.days_remaining),
      is_joined: Boolean(challenge.is_joined),
      is_completed: Boolean(challenge.is_completed),
      participant_count: Number(challenge.participant_count),
      created_by: null,
      family_scope: "all" as const,
      is_active: true,
      created_at: "",
      updated_at: "",
    }));
  } catch {
    return [];
  }
}

export default async function AchievementsPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Fetch all data in parallel
  const [badges, stats, leaderboard, challenges] = await Promise.all([
    getBadgesWithProgress(user.id),
    getGamificationStats(user.id),
    getLeaderboard(user.id),
    getActiveChallenges(user.id),
  ]);

  return (
    <AchievementsClient
      locale={locale}
      userId={user.id}
      badges={badges}
      stats={stats}
      leaderboard={leaderboard}
      challenges={challenges}
    />
  );
}
