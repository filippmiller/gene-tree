/**
 * Gamification System Types
 * Types for streaks, challenges, leaderboards, and points
 */

export type ActionType =
  | 'photo_upload'
  | 'photo_tag'
  | 'story_write'
  | 'story_respond'
  | 'voice_story_record'
  | 'invite_send'
  | 'invite_accepted'
  | 'relative_add'
  | 'comment_add'
  | 'reaction_add'
  | 'profile_update'
  | 'profile_photo_set'
  | 'bio_write'
  | 'daily_login'
  | 'daily_streak_bonus'
  | 'milestone_reached'
  | 'tribute_create'
  | 'interview_elder';

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_type: 'daily' | 'weekly';
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  streak_frozen_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  action_type: ActionType;
  action_id: string | null;
  description: string | null;
  created_at: string;
}

export interface PointValue {
  action_type: ActionType;
  points: number;
  description: string;
  description_ru: string | null;
  daily_limit: number | null;
  is_active: boolean;
}

export interface FamilyChallenge {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  description_ru: string | null;
  challenge_type: 'photo_upload' | 'story_write' | 'invite_family' | 'profile_complete' | 'custom';
  target_value: number;
  reward_points: number;
  reward_badge_id: string | null;
  start_date: string;
  end_date: string;
  created_by: string | null;
  family_scope: 'all' | 'circle';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  completed_at: string | null;
  reward_claimed: boolean;
  joined_at: string;
}

export interface ChallengeWithProgress extends FamilyChallenge {
  current_progress: number;
  days_remaining: number;
  is_joined: boolean;
  is_completed: boolean;
  participant_count: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  current_streak: number;
  badge_count: number;
}

export interface LeaderboardSettings {
  user_id: string;
  show_on_leaderboard: boolean;
  show_real_name: boolean;
  show_points: boolean;
  show_badges: boolean;
  updated_at: string;
}

export interface GamificationStats {
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

export interface ActivityResult {
  points_earned: number;
  new_streak: number;
  streak_increased: boolean;
  badges_earned: string[];
}

export interface StreakStatus {
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  daysUntilLost: number;
  lastActivityDate: Date | null;
  isFrozen: boolean;
  frozenUntil: Date | null;
}

export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';
