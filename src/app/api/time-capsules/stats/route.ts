import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export async function GET() {
  try {
    const supabase = await getSupabaseSSR();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count pending capsules sent by this user
    const { count: pendingSent, error: pendingError } = await supabase
      .from('time_capsules')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('delivery_status', 'pending');

    if (pendingError) {
      console.error('[TimeCapsules] Error fetching pending count:', pendingError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Count delivered (unread) capsules for this user
    const { count: unreadDelivered, error: deliveredError } = await supabase
      .from('time_capsules')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', user.id)
      .eq('delivery_status', 'delivered');

    if (deliveredError) {
      console.error('[TimeCapsules] Error fetching delivered count:', deliveredError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({
      pendingSent: pendingSent || 0,
      unreadDelivered: unreadDelivered || 0,
    });
  } catch (error) {
    console.error('[TimeCapsules] Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
