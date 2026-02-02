import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { UnreadCountResponse } from '@/types/messaging';

// Type for thread data
interface ThreadData {
  id: string;
  participant_1: string;
  participant_2: string;
}

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the current user
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all threads where user is a participant
    const { data: threadsData, error: threadsError } = await supabase
      .from('message_threads')
      .select('id, participant_1, participant_2')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }

    const threads = threadsData as unknown as ThreadData[] | null;

    if (!threads || threads.length === 0) {
      return NextResponse.json({ count: 0 } as UnreadCountResponse);
    }

    // Count unread messages across all threads
    // (messages from other users that haven't been read)
    let totalUnread = 0;

    for (const thread of threads) {
      const otherParticipantId =
        thread.participant_1 === user.id ? thread.participant_2 : thread.participant_1;

      const { count } = await supabase
        .from('family_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .eq('from_user_id', otherParticipantId)
        .is('read_at', null);

      totalUnread += count || 0;
    }

    return NextResponse.json({ count: totalUnread } as UnreadCountResponse);
  } catch (error) {
    console.error('Error in GET /api/messages/unread-count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
