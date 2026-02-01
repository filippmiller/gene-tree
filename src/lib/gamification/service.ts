/**
 * Gamification Service
 * Server-side service for managing streaks, points, challenges, and leaderboards
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type {
  ActionType,
  UserStreak,
  GamificationStats,
  LeaderboardEntry,
  LeaderboardPeriod,
  ChallengeWithProgress,
  PointTransaction,
  ActivityResult,
  StreakStatus,
} from './types';

/**
 * Record user activity and update gamification state
 * This is the main entry point for awarding points and tracking activity
 */
export async function recordActivity(
  userId: string,
  actionType: ActionType,
  actionId?: string,
  description?: string
): Promise<ActivityResult | null> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('record_user_activity', {
      p_user_id: userId,
      p_action_type: actionType,
      p_action_id: actionId ?? null,
      p_description: description ?? null,
    });

    if (error) {
      console.error('[Gamification] Failed to record activity:', error);
      return null;
    }

    // The function returns a single row
    const result = Array.isArray(data) ? data[0] : data;

    return {
      points_earned: result?.points_earned ?? 0,
      new_streak: result?.new_streak ?? 0,
      streak_increased: result?.streak_increased ?? false,
      badges_earned: result?.badges_earned ?? [],
    };
  } catch (err) {
    console.error('[Gamification] Error recording activity:', err);
    return null;
  }
}

/**
 * Get user's current streak status
 */
export async function getStreakStatus(userId: string): Promise<StreakStatus | null> {
  const supabase = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Gamification] Failed to get streak status:', error);
    return null;
  }

  if (!data) {
    return {
      isActive: false,
      currentStreak: 0,
      longestStreak: 0,
      daysUntilLost: 0,
      lastActivityDate: null,
      isFrozen: false,
      frozenUntil: null,
    };
  }

  const streak = data as UserStreak;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = streak.last_activity_date
    ? new Date(streak.last_activity_date)
    : null;

  let daysUntilLost = 0;
  let isActive = false;

  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Active today
      isActive = true;
      daysUntilLost = 2; // Tomorrow is still okay
    } else if (diffDays === 1) {
      // Need to be active today
      isActive = true;
      daysUntilLost = 1;
    } else {
      // Streak broken
      isActive = false;
      daysUntilLost = 0;
    }
  }

  // Check for streak freeze
  const isFrozen = streak.streak_frozen_until
    ? new Date(streak.streak_frozen_until) >= today
    : false;

  if (isFrozen) {
    isActive = true;
    daysUntilLost = Math.ceil(
      (new Date(streak.streak_frozen_until!).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return {
    isActive,
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    daysUntilLost,
    lastActivityDate: lastActivity,
    isFrozen,
    frozenUntil: streak.streak_frozen_until
      ? new Date(streak.streak_frozen_until)
      : null,
  };
}

/**
 * Get comprehensive gamification stats for a user
 */
export async function getGamificationStats(
  userId: string
): Promise<GamificationStats | null> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_user_gamification_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Gamification] Failed to get stats:', error);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (Array.isArray(data) ? data[0] : data) as any;

    return {
      current_streak: result?.current_streak ?? 0,
      longest_streak: result?.longest_streak ?? 0,
      total_points: result?.total_points ?? 0,
      weekly_points: result?.weekly_points ?? 0,
      monthly_points: result?.monthly_points ?? 0,
      rank_in_family: result?.rank_in_family ?? 0,
      total_family_members: result?.total_family_members ?? 0,
      badges_earned: result?.badges_earned ?? 0,
      challenges_completed: result?.challenges_completed ?? 0,
      active_challenges: result?.active_challenges ?? 0,
    };
  } catch (err) {
    console.error('[Gamification] Error getting stats:', err);
    return null;
  }
}

/**
 * Get family leaderboard
 */
export async function getLeaderboard(
  userId: string,
  period: LeaderboardPeriod = 'all',
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_family_leaderboard', {
      p_user_id: userId,
      p_period: period,
      p_limit: limit,
    });

    if (error) {
      console.error('[Gamification] Failed to get leaderboard:', error);
      return [];
    }

    return (data || []).map((entry: Record<string, unknown>) => ({
      rank: Number(entry.rank),
      user_id: String(entry.user_id),
      display_name: String(entry.display_name),
      avatar_url: entry.avatar_url ? String(entry.avatar_url) : null,
      points: Number(entry.points),
      current_streak: Number(entry.current_streak),
      badge_count: Number(entry.badge_count),
    }));
  } catch (err) {
    console.error('[Gamification] Error getting leaderboard:', err);
    return [];
  }
}

/**
 * Get active challenges for a user
 */
export async function getActiveChallenges(
  userId: string
): Promise<ChallengeWithProgress[]> {
  const supabase = getSupabaseAdmin();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_active_challenges', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Gamification] Failed to get challenges:', error);
      return [];
    }

    return (data || []).map((challenge: Record<string, unknown>) => ({
      id: String(challenge.challenge_id),
      title: String(challenge.title),
      title_ru: challenge.title_ru ? String(challenge.title_ru) : null,
      description: challenge.description ? String(challenge.description) : null,
      description_ru: challenge.description_ru
        ? String(challenge.description_ru)
        : null,
      challenge_type: String(challenge.challenge_type) as ChallengeWithProgress['challenge_type'],
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
      family_scope: 'all' as const,
      is_active: true,
      created_at: '',
      updated_at: '',
    }));
  } catch (err) {
    console.error('[Gamification] Error getting challenges:', err);
    return [];
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(
  userId: string,
  challengeId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('challenge_participants').insert({
    challenge_id: challengeId,
    user_id: userId,
  });

  if (error) {
    console.error('[Gamification] Failed to join challenge:', error);
    return false;
  }

  return true;
}

/**
 * Claim challenge reward
 */
export async function claimChallengeReward(
  userId: string,
  challengeId: string
): Promise<{ points: number; badge_id: string | null } | null> {
  const supabase = getSupabaseAdmin();

  // Get challenge details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: challenge, error: challengeError } = await (supabase as any)
    .from('family_challenges')
    .select('reward_points, reward_badge_id')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) {
    console.error('[Gamification] Failed to get challenge:', challengeError);
    return null;
  }

  // Check if completed and not claimed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: participant, error: participantError } = await (supabase as any)
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (participantError || !participant) {
    console.error('[Gamification] Participant not found:', participantError);
    return null;
  }

  if (!participant.completed_at || participant.reward_claimed) {
    console.error('[Gamification] Challenge not completed or already claimed');
    return null;
  }

  // Mark as claimed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('challenge_participants')
    .update({ reward_claimed: true })
    .eq('id', participant.id);

  if (updateError) {
    console.error('[Gamification] Failed to mark as claimed:', updateError);
    return null;
  }

  // Award points
  if (challenge.reward_points > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('point_transactions').insert({
      user_id: userId,
      points: challenge.reward_points,
      action_type: 'milestone_reached',
      action_id: challengeId,
      description: 'Challenge reward',
    });
  }

  // Award badge if any
  if (challenge.reward_badge_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_badges').insert({
      user_id: userId,
      badge_id: challenge.reward_badge_id,
    });
  }

  return {
    points: challenge.reward_points,
    badge_id: challenge.reward_badge_id,
  };
}

/**
 * Get recent point transactions
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 20
): Promise<PointTransaction[]> {
  const supabase = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('point_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Gamification] Failed to get transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Update leaderboard settings
 */
export async function updateLeaderboardSettings(
  userId: string,
  settings: Partial<{
    show_on_leaderboard: boolean;
    show_real_name: boolean;
    show_points: boolean;
    show_badges: boolean;
  }>
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('leaderboard_settings')
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[Gamification] Failed to update settings:', error);
    return false;
  }

  return true;
}

/**
 * Freeze streak (e.g., for vacation)
 */
export async function freezeStreak(
  userId: string,
  days: number
): Promise<boolean> {
  if (days < 1 || days > 14) {
    console.error('[Gamification] Invalid freeze duration');
    return false;
  }

  const supabase = getSupabaseAdmin();
  const freezeUntil = new Date();
  freezeUntil.setDate(freezeUntil.getDate() + days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_streaks')
    .update({
      streak_frozen_until: freezeUntil.toISOString().split('T')[0],
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[Gamification] Failed to freeze streak:', error);
    return false;
  }

  return true;
}
