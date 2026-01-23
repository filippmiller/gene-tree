// Comment Types
// Type definitions for the story comments system

/**
 * Comment record from database
 */
export interface StoryComment {
  id: string;
  story_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  mentioned_profile_ids: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Comment with author profile info
 */
export interface CommentWithAuthor extends StoryComment {
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

/**
 * Threaded comment with replies
 */
export interface ThreadedComment extends CommentWithAuthor {
  replies: CommentWithAuthor[];
  replyCount: number;
}

/**
 * Mentioned profile for @mention display
 */
export interface MentionedProfile {
  id: string;
  first_name: string;
  last_name: string;
}

/**
 * Request body for creating a comment
 */
export interface CreateCommentRequest {
  content: string;
  parent_id?: string | null;
  mentioned_profile_ids?: string[];
}

/**
 * Request body for updating a comment
 */
export interface UpdateCommentRequest {
  content: string;
  mentioned_profile_ids?: string[];
}

/**
 * Response for comment operations
 */
export interface CommentResponse {
  success: boolean;
  comment?: CommentWithAuthor;
  error?: string;
}

/**
 * Response for listing comments
 */
export interface GetCommentsResponse {
  comments: ThreadedComment[];
  total: number;
}

/**
 * Comment form state
 */
export interface CommentFormState {
  content: string;
  mentionedProfiles: MentionedProfile[];
  isSubmitting: boolean;
  replyingTo: string | null;
}

/**
 * Maximum comment length
 */
export const MAX_COMMENT_LENGTH = 2000;

/**
 * Maximum threading depth (2 levels: comment + reply)
 */
export const MAX_THREAD_DEPTH = 2;

/**
 * Parse mentions from content
 * Format: @[Display Name](profile-uuid)
 */
export function parseMentions(content: string): { profileId: string; displayName: string }[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: { profileId: string; displayName: string }[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      displayName: match[1],
      profileId: match[2],
    });
  }

  return mentions;
}

/**
 * Format mention for insertion into content
 */
export function formatMention(profile: MentionedProfile): string {
  return `@[${profile.first_name} ${profile.last_name}](${profile.id})`;
}

/**
 * Replace mention syntax with display names for rendering
 */
export function renderMentions(content: string): string {
  return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
}
