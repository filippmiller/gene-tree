import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { NotificationsApiResponse } from '@/types/notifications';

// GET /api/notifications
// Returns latest notifications for current user with actor profile info
export async function GET() {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Fetch notifications with actor profile info via join
  const { data, error } = await admin
    .from('notification_recipients')
    .select(
      `
      notification_id,
      is_read,
      read_at,
      notification:notifications (
        id,
        event_type,
        actor_profile_id,
        primary_profile_id,
        related_profile_id,
        payload,
        created_at,
        actor:user_profiles!notifications_actor_profile_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      )
    `
    )
    .eq('profile_id', user.id)
    .order('created_at', { foreignTable: 'notifications', ascending: false })
    .limit(50);

  if (error) {
    console.error('[Notifications API] Failed to fetch notifications', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  // Transform the nested actor data into flat fields for easier consumption
  const notifications = ((data as unknown[]) || []).map((row: unknown) => {
    const typedRow = row as {
      notification_id: string;
      is_read: boolean;
      read_at: string | null;
      notification: {
        id: string;
        event_type: string;
        actor_profile_id: string;
        primary_profile_id: string | null;
        related_profile_id: string | null;
        payload: Record<string, unknown> | null;
        created_at: string;
        actor: {
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
        } | null;
      };
    };

    const { actor, ...notificationData } = typedRow.notification;

    return {
      notification_id: typedRow.notification_id,
      is_read: typedRow.is_read,
      read_at: typedRow.read_at,
      notification: {
        ...notificationData,
        actor_first_name: actor?.first_name ?? null,
        actor_last_name: actor?.last_name ?? null,
        actor_avatar_url: actor?.avatar_url ?? null,
      },
    };
  });

  const response: NotificationsApiResponse = { notifications };
  return NextResponse.json(response);
}
