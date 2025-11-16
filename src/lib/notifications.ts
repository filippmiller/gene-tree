import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export type NotificationEventType = 'relative_added' | 'media_added';

interface BaseNotificationPayload {
  [key: string]: unknown;
}

interface CreateNotificationOptions {
  eventType: NotificationEventType;
  actorUserId: string; // auth.users.id (совпадает с profile_id в user_profiles)
  primaryProfileId?: string | null;
  relatedProfileId?: string | null;
  payload?: BaseNotificationPayload;
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
      payload: payload ?? null,
    })
    .select('id')
    .single();

  if (notifError || !notification) {
    console.error('[Notifications] Failed to insert notification', notifError);
    return;
  }

  const notificationId: string = notification.id;

  // 2) Compute recipients via helper function in DB
  const { data: familyRows, error: familyError } = await admin
    .rpc('get_family_circle_profile_ids', { p_user_id: actorUserId });

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
