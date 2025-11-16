import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

// GET /api/notifications
// Returns latest notifications for current user
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

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
        created_at
      )
    `,
    )
    .eq('profile_id', user.id)
    .order('notification.created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Notifications API] Failed to fetch notifications', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  return NextResponse.json({ notifications: data || [] });
}
