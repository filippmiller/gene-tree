// Reaction Types
// Type definitions for the reactions system

/**
 * Available reaction types (emoji-based)
 */
export type ReactionType = 'heart' | 'sad' | 'hug' | 'laugh' | 'pray';

/**
 * Target types that can receive reactions
 */
export type ReactionTargetType = 'story' | 'photo' | 'comment';

/**
 * Reaction record from database
 */
export interface Reaction {
  id: string;
  target_type: ReactionTargetType;
  target_id: string;
  profile_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

/**
 * Reaction with actor profile info
 */
export interface ReactionWithActor extends Reaction {
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

/**
 * Aggregated reaction counts by type
 */
export interface ReactionCounts {
  heart: number;
  sad: number;
  hug: number;
  laugh: number;
  pray: number;
  total: number;
}

/**
 * Request body for adding a reaction
 */
export interface AddReactionRequest {
  target_type: ReactionTargetType;
  target_id: string;
  reaction_type: ReactionType;
}

/**
 * Request body for removing a reaction
 */
export interface RemoveReactionRequest {
  target_type: ReactionTargetType;
  target_id: string;
}

/**
 * Response for reaction operations
 */
export interface ReactionResponse {
  success: boolean;
  reaction?: Reaction;
  counts: ReactionCounts;
  userReaction: ReactionType | null;
}

/**
 * Response for getting reactions on a target
 */
export interface GetReactionsResponse {
  reactions: ReactionWithActor[];
  counts: ReactionCounts;
  userReaction: ReactionType | null;
}

/**
 * Reaction emoji mapping for display
 */
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  sad: '😢',
  hug: '🤗',
  laugh: '😄',
  pray: '🙏',
};

/**
 * Reaction labels for accessibility
 */
export const REACTION_LABELS: Record<ReactionType, string> = {
  heart: 'Love',
  sad: 'Sad',
  hug: 'Hug',
  laugh: 'Laugh',
  pray: 'Prayer',
};

/**
 * All available reaction types in display order
 */
export const REACTION_TYPES: ReactionType[] = ['heart', 'sad', 'hug', 'laugh', 'pray'];

/**
 * Helper to create empty reaction counts
 */
export function emptyReactionCounts(): ReactionCounts {
  return {
    heart: 0,
    sad: 0,
    hug: 0,
    laugh: 0,
    pray: 0,
    total: 0,
  };
}
