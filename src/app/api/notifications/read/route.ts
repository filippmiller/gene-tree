import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface MarkReadBody {
  ids: string[];
}

// POST /api/notifications/read
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: MarkReadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('notification_recipients')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('profile_id', user.id)
    .in('notification_id', body.ids);

  if (error) {
    console.error('[Notifications API] Failed to mark as read', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
