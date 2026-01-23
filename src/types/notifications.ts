// Notification Types
// Centralized type definitions for the notification system

/**
 * All notification event types supported by the system
 */
export type NotificationEventType =
  | 'relative_added'
  | 'media_added'
  | 'STORY_SUBMITTED'
  | 'STORY_APPROVED'
  | 'STORY_REJECTED';

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
  ].includes(value);
}
