// Activity Types
// Type definitions for the activity feed system

import type { ReactionType } from './reactions';

/**
 * Activity event types
 */
export type ActivityEventType =
  | 'reaction_added'
  | 'comment_added'
  | 'story_created'
  | 'photo_added'
  | 'profile_updated'
  | 'relative_added'
  | 'relationship_verified';

/**
 * Subject types for activity events
 */
export type ActivitySubjectType = 'story' | 'photo' | 'comment' | 'profile' | 'relationship';

/**
 * Visibility levels
 */
export type ActivityVisibility = 'public' | 'family' | 'private' | 'unlisted';

/**
 * Activity event record from database
 */
export interface ActivityEvent {
  id: string;
  event_type: ActivityEventType;
  actor_id: string;
  subject_type: ActivitySubjectType;
  subject_id: string;
  display_data: ActivityDisplayData;
  visibility: ActivityVisibility;
  created_at: string;
}

/**
 * Display data stored in JSONB for fast rendering
 */
export interface ActivityDisplayData {
  // Actor info (denormalized for fast display)
  actor_name?: string;
  actor_avatar?: string | null;

  // Subject info
  subject_title?: string;
  subject_preview?: string;
  subject_media_url?: string;

  // Event-specific data
  reaction_type?: ReactionType;
  comment_preview?: string;
  relationship_type?: string;
  related_profile_name?: string;
}

/**
 * Activity event with full actor profile
 */
export interface ActivityEventWithActor extends ActivityEvent {
  actor: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

/**
 * Request params for activity feed
 */
export interface GetActivityFeedParams {
  cursor?: string; // ISO timestamp for pagination
  limit?: number;
  filter?: ActivityEventType[];
}

/**
 * Response for activity feed
 */
export interface ActivityFeedResponse {
  events: ActivityEventWithActor[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Activity feed display configuration
 */
export interface ActivityDisplayConfig {
  icon: string;
  color: string;
  getMessage: (event: ActivityEventWithActor) => string;
  getLink: (event: ActivityEventWithActor) => string;
}

/**
 * Default page size for activity feed
 */
export const ACTIVITY_FEED_PAGE_SIZE = 20;

/**
 * Activity event icons
 */
export const ACTIVITY_ICONS: Record<ActivityEventType, string> = {
  reaction_added: '💗',
  comment_added: '💬',
  story_created: '📖',
  photo_added: '📷',
  profile_updated: '✏️',
  relative_added: '👨‍👩‍👧',
  relationship_verified: '✅',
};

/**
 * Get human-readable description for activity event
 */
export function getActivityDescription(event: ActivityEventWithActor): string {
  const actorName = `${event.actor.first_name} ${event.actor.last_name}`;

  switch (event.event_type) {
    case 'reaction_added':
      return `${actorName} reacted to ${event.display_data.subject_title || 'a story'}`;
    case 'comment_added':
      return `${actorName} commented on ${event.display_data.subject_title || 'a story'}`;
    case 'story_created':
      return `${actorName} shared a new story`;
    case 'photo_added':
      return `${actorName} added a photo`;
    case 'profile_updated':
      return `${actorName} updated their profile`;
    case 'relative_added':
      return `${actorName} added ${event.display_data.related_profile_name || 'a relative'}`;
    case 'relationship_verified':
      return `${actorName} verified a family connection`;
    default:
      return `${actorName} did something`;
  }
}

/**
 * Get navigation link for activity event
 */
export function getActivityLink(event: ActivityEvent): string {
  switch (event.subject_type) {
    case 'story':
      return `/stories/${event.subject_id}`;
    case 'photo':
      return `/photos/${event.subject_id}`;
    case 'profile':
      return `/profile/${event.subject_id}`;
    case 'comment':
      // Comments link to their parent story
      return event.display_data.subject_title
        ? `/stories/${event.subject_id}`
        : '/stories';
    default:
      return '/dashboard';
  }
}
