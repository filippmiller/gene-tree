// Notification Types
// Centralized type definitions for the notification system

/**
 * All notification event types supported by the system
 */
export type NotificationEventType =
  // Existing events
  | 'relative_added'
  | 'media_added'
  | 'STORY_SUBMITTED'
  | 'STORY_APPROVED'
  | 'STORY_REJECTED'
  // Phase 1: Engagement
  | 'REACTION_RECEIVED'
  | 'COMMENT_ADDED'
  | 'COMMENT_REPLY'
  | 'MENTION_IN_COMMENT'
  // Phase 2: Daily engagement - Birthday/Anniversary nudges
  | 'BIRTHDAY_REMINDER'
  | 'BIRTHDAY_TODAY'
  | 'ANNIVERSARY_REMINDER'
  | 'MEMORIAL_REMINDER'
  | 'PHOTO_TAGGED'
  // Phase 3: Advanced (future)
  | 'TRIBUTE_GUESTBOOK'
  | 'ELDER_QUESTION_ASKED'
  | 'ELDER_QUESTION_ANSWERED'
  // Story prompts
  | 'PROMPT_ASSIGNED'
  // Invitation system
  | 'INVITATION_ACCEPTED'
  | 'CLAIM_DISPUTED'
  // Bridge requests
  | 'BRIDGE_REQUEST_RECEIVED'
  | 'BRIDGE_REQUEST_ACCEPTED'
  // Time capsules
  | 'TIME_CAPSULE_DELIVERED'
  // Family chat
  | 'FAMILY_CHAT_MESSAGE'
  | 'FAMILY_CHAT_MENTION';

/**
 * Payload for 'relative_added' event
 */
export interface RelativeAddedPayload {
  first_name: string;
  last_name: string;
  relationship_type: string;
}

/**
 * Payload for 'media_added' event
 */
export interface MediaAddedPayload {
  photo_id?: string;
  story_id?: string;
  media_type: 'photo' | 'video' | 'voice';
  bucket?: string;
  kind?: string;
}

/**
 * Payload for 'STORY_SUBMITTED' event
 */
export interface StorySubmittedPayload {
  story_id: string;
  media_type: string;
  preview?: string;
}

/**
 * Payload for 'STORY_APPROVED' event
 */
export interface StoryApprovedPayload {
  story_id: string;
  title: string;
}

/**
 * Payload for 'STORY_REJECTED' event
 */
export interface StoryRejectedPayload {
  story_id: string;
  title: string;
  reason?: string;
}

/**
 * Payload for 'REACTION_RECEIVED' event
 */
export interface ReactionReceivedPayload {
  target_type: 'story' | 'photo' | 'comment';
  target_id: string;
  reaction_type: string;
  target_title?: string;
}

/**
 * Payload for 'COMMENT_ADDED' event
 */
export interface CommentAddedPayload {
  story_id: string;
  comment_id: string;
  comment_preview: string;
  story_title?: string;
}

/**
 * Payload for 'COMMENT_REPLY' event
 */
export interface CommentReplyPayload {
  story_id: string;
  comment_id: string;
  parent_comment_id: string;
  comment_preview: string;
}

/**
 * Payload for 'MENTION_IN_COMMENT' event
 */
export interface MentionInCommentPayload {
  story_id: string;
  comment_id: string;
  comment_preview: string;
  story_title?: string;
}

/**
 * Payload for 'BIRTHDAY_REMINDER' and 'BIRTHDAY_TODAY' events
 */
export interface BirthdayReminderPayload {
  person_id: string;
  person_name: string;
  birth_date: string;
  age?: number;
  days_until: number; // 0 = today, 1 = tomorrow, etc.
  relationship_label?: string;
}

/**
 * Payload for 'ANNIVERSARY_REMINDER' event
 */
export interface AnniversaryReminderPayload {
  person1_id: string;
  person2_id: string;
  person1_name: string;
  person2_name: string;
  marriage_date: string;
  years_married?: number;
  days_until: number;
}

/**
 * Payload for 'MEMORIAL_REMINDER' event (death anniversary)
 */
export interface MemorialReminderPayload {
  person_id: string;
  person_name: string;
  death_date: string;
  years_since?: number;
  days_until: number;
}

/**
 * Payload for 'PROMPT_ASSIGNED' event
 */
export interface PromptAssignedPayload {
  prompt_id: string;
  prompt_text: string;
  assigned_prompt_id: string;
  message?: string | null;
}

/**
 * Payload for 'INVITATION_ACCEPTED' event
 */
export interface InvitationAcceptedPayload {
  first_name: string;
  last_name: string;
  relationship_type: string;
  accepted: boolean;
}

/**
 * Payload for 'CLAIM_DISPUTED' event
 * When someone clicks "This isn't me" on an invitation
 */
export interface ClaimDisputedPayload {
  first_name: string;
  last_name: string;
  relationship_type: string;
  reason?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Payload for 'BRIDGE_REQUEST_RECEIVED' event
 */
export interface BridgeRequestReceivedPayload {
  request_id: string;
  claimed_relationship: string;
  first_name: string;
  last_name: string;
}

/**
 * Payload for 'BRIDGE_REQUEST_ACCEPTED' event
 */
export interface BridgeRequestAcceptedPayload {
  request_id: string;
  relationship_type: string;
  first_name: string;
  last_name: string;
}

/**
 * Payload for 'TIME_CAPSULE_DELIVERED' event
 */
export interface TimeCapsuleDeliveredPayload {
  capsule_id: string;
  title: string;
  creator_name: string;
  /** True if this is a family broadcast (sent to all family members) */
  is_broadcast?: boolean;
}

/**
 * Payload for 'FAMILY_CHAT_MESSAGE' event
 */
export interface FamilyChatMessagePayload {
  chat_id: string;
  message_id: string;
  sender_name: string;
  preview: string;
}

/**
 * Payload for 'FAMILY_CHAT_MENTION' event
 */
export interface FamilyChatMentionPayload {
  chat_id: string;
  message_id: string;
  sender_name: string;
  preview: string;
}

/**
 * Union of all notification payloads.
 * Note: We use a flexible type here because payloads can vary and
 * the database stores them as JSON. For type-safe access, cast to
 * the specific payload type based on event_type.
 */
export type NotificationPayload = Record<string, unknown>;

/**
 * Core notification data from database
 */
export interface NotificationData {
  id: string;
  event_type: string; // Using string for flexibility with DB values
  actor_profile_id: string;
  primary_profile_id: string | null;
  related_profile_id: string | null;
  payload: NotificationPayload | null;
  created_at: string;
}

/**
 * Actor profile info joined from user_profiles
 */
export interface ActorInfo {
  actor_first_name: string | null;
  actor_last_name: string | null;
  actor_avatar_url: string | null;
}

/**
 * Full notification with actor info (from API response)
 */
export interface NotificationWithActor extends NotificationData, ActorInfo {}

/**
 * Notification row as returned by the API (includes read status)
 */
export interface NotificationRow {
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  notification: NotificationWithActor;
}

/**
 * API response structure for GET /api/notifications
 */
export interface NotificationsApiResponse {
  notifications: NotificationRow[];
}

/**
 * Type guard to check if event_type is a valid NotificationEventType
 */
export function isNotificationEventType(value: string): value is NotificationEventType {
  return [
    'relative_added',
    'media_added',
    'STORY_SUBMITTED',
    'STORY_APPROVED',
    'STORY_REJECTED',
    'REACTION_RECEIVED',
    'COMMENT_ADDED',
    'COMMENT_REPLY',
    'MENTION_IN_COMMENT',
    'BIRTHDAY_REMINDER',
    'BIRTHDAY_TODAY',
    'ANNIVERSARY_REMINDER',
    'MEMORIAL_REMINDER',
    'PHOTO_TAGGED',
    'TRIBUTE_GUESTBOOK',
    'ELDER_QUESTION_ASKED',
    'ELDER_QUESTION_ANSWERED',
    'PROMPT_ASSIGNED',
    'INVITATION_ACCEPTED',
    'CLAIM_DISPUTED',
    'BRIDGE_REQUEST_RECEIVED',
    'BRIDGE_REQUEST_ACCEPTED',
    'TIME_CAPSULE_DELIVERED',
    'FAMILY_CHAT_MESSAGE',
    'FAMILY_CHAT_MENTION',
  ].includes(value);
}
