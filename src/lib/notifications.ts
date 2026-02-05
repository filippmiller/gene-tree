import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { Json } from '@/lib/types/supabase';
import type {
  NotificationEventType,
  NotificationPayload,
  StorySubmittedPayload,
  StoryApprovedPayload,
  StoryRejectedPayload,
  ReactionReceivedPayload,
  CommentAddedPayload,
  CommentReplyPayload,
  MentionInCommentPayload,
  BirthdayReminderPayload,
  AnniversaryReminderPayload,
  MemorialReminderPayload,
  TimeCapsuleDeliveredPayload,
} from '@/types/notifications';

// Re-export types for convenience
export type {
  NotificationEventType,
  NotificationPayload,
  RelativeAddedPayload,
  MediaAddedPayload,
  StorySubmittedPayload,
  StoryApprovedPayload,
  StoryRejectedPayload,
  ReactionReceivedPayload,
  CommentAddedPayload,
  CommentReplyPayload,
  MentionInCommentPayload,
  BirthdayReminderPayload,
  AnniversaryReminderPayload,
  MemorialReminderPayload,
  TimeCapsuleDeliveredPayload,
  NotificationData,
  ActorInfo,
  NotificationWithActor,
  NotificationRow,
  NotificationsApiResponse,
} from '@/types/notifications';
export { isNotificationEventType } from '@/types/notifications';

interface CreateNotificationOptions {
  eventType: NotificationEventType;
  actorUserId: string; // auth.users.id (matches profile_id in user_profiles)
  primaryProfileId?: string | null;
  relatedProfileId?: string | null;
  payload?: NotificationPayload;
}

/**
 * Creates a notification and fan-outs it to all family circle members
 * (including the actor themselves).
 */
export async function createNotification(options: CreateNotificationOptions) {
  const { eventType, actorUserId, primaryProfileId, relatedProfileId, payload } = options;

  const admin = getSupabaseAdmin();

  // 1) Insert notification
  const { data: notification, error: notifError } = await admin
    .from('notifications')
    .insert({
      event_type: eventType,
      actor_profile_id: actorUserId,
      primary_profile_id: primaryProfileId ?? actorUserId,
      related_profile_id: relatedProfileId ?? null,
      payload: (payload ?? null) as Json,
    })
    .select('id')
    .single();

  if (notifError || !notification) {
    console.error('[Notifications] Failed to insert notification', notifError);
    return;
  }

  const notificationId: string = notification.id;

  // 2) Compute recipients via helper function in DB
  const { data: familyRows, error: familyError } = await admin.rpc(
    'get_family_circle_profile_ids',
    { p_user_id: actorUserId }
  );

  if (familyError) {
    console.error('[Notifications] Failed to fetch family circle', familyError);
  }

  const profileIds = new Set<string>();

  // Add family circle
  for (const row of (familyRows as { profile_id: string }[] | null) || []) {
    if (row.profile_id) profileIds.add(row.profile_id);
  }

  // Always include actor themselves
  profileIds.add(actorUserId);

  if (profileIds.size === 0) {
    return;
  }

  const recipientRows = Array.from(profileIds).map((profileId) => ({
    notification_id: notificationId,
    profile_id: profileId,
  }));

  const { error: recipientsError } = await admin
    .from('notification_recipients')
    .insert(recipientRows);

  if (recipientsError) {
    console.error('[Notifications] Failed to insert notification_recipients', recipientsError);
  }
}

/**
 * Generates the navigation URL for a notification based on its event type and payload.
 *
 * @param eventType - The type of notification event (string from DB)
 * @param payload - The notification payload (can be null/undefined)
 * @param notification - Object containing profile IDs for navigation context
 * @returns The URL path to navigate to when the notification is clicked
 */
export function getNotificationUrl(
  eventType: string,
  payload: NotificationPayload | null | undefined,
  notification: {
    primary_profile_id?: string | null;
    related_profile_id?: string | null;
  }
): string {
  switch (eventType) {
    case 'relative_added':
      // Navigate to the added person's profile or tree
      return notification.related_profile_id
        ? `/profile/${notification.related_profile_id}`
        : '/tree';

    case 'media_added':
      // Navigate to the profile with photos
      return notification.primary_profile_id
        ? `/profile/${notification.primary_profile_id}`
        : '/tree';

    case 'STORY_SUBMITTED':
    case 'STORY_APPROVED':
    case 'STORY_REJECTED': {
      const storyPayload = payload as
        | StorySubmittedPayload
        | StoryApprovedPayload
        | StoryRejectedPayload
        | null;
      if (storyPayload?.story_id) {
        return `/stories/${storyPayload.story_id}`;
      }
      return '/stories';
    }

    case 'REACTION_RECEIVED': {
      const reactionPayload = payload as ReactionReceivedPayload | null;
      if (reactionPayload?.target_type === 'story' && reactionPayload?.target_id) {
        return `/stories/${reactionPayload.target_id}`;
      }
      if (reactionPayload?.target_type === 'photo' && reactionPayload?.target_id) {
        return `/photos/${reactionPayload.target_id}`;
      }
      return '/stories';
    }

    case 'COMMENT_ADDED':
    case 'COMMENT_REPLY':
    case 'MENTION_IN_COMMENT': {
      const commentPayload = payload as
        | CommentAddedPayload
        | CommentReplyPayload
        | MentionInCommentPayload
        | null;
      if (commentPayload?.story_id) {
        return `/stories/${commentPayload.story_id}`;
      }
      return '/stories';
    }

    case 'BIRTHDAY_TODAY':
    case 'BIRTHDAY_REMINDER': {
      const birthdayPayload = payload as BirthdayReminderPayload | null;
      if (birthdayPayload?.person_id) {
        return `/profile/${birthdayPayload.person_id}`;
      }
      return notification.primary_profile_id
        ? `/profile/${notification.primary_profile_id}`
        : '/tree';
    }

    case 'ANNIVERSARY_REMINDER': {
      const anniversaryPayload = payload as AnniversaryReminderPayload | null;
      if (anniversaryPayload?.person1_id) {
        return `/profile/${anniversaryPayload.person1_id}`;
      }
      return notification.primary_profile_id
        ? `/profile/${notification.primary_profile_id}`
        : '/tree';
    }

    case 'MEMORIAL_REMINDER': {
      const memorialPayload = payload as MemorialReminderPayload | null;
      if (memorialPayload?.person_id) {
        return `/tribute/${memorialPayload.person_id}`;
      }
      return notification.primary_profile_id
        ? `/tribute/${notification.primary_profile_id}`
        : '/tree';
    }

    case 'INVITATION_ACCEPTED':
    case 'CLAIM_DISPUTED':
      // Navigate to the people page to manage invitations
      return '/people';

    case 'TIME_CAPSULE_DELIVERED': {
      const capsulePayload = payload as TimeCapsuleDeliveredPayload | null;
      if (capsulePayload?.capsule_id) {
        return `/time-capsules?open=${capsulePayload.capsule_id}`;
      }
      return '/time-capsules';
    }

    case 'FAMILY_CHAT_MESSAGE':
    case 'FAMILY_CHAT_MENTION':
      return '/family-chat';

    default:
      // Fallback to dashboard
      return '/app';
  }
}
