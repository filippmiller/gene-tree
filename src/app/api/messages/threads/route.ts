import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { ThreadWithDetails, ThreadsResponse, CreateThreadResponse, MessageThread } from '@/types/messaging';

// Type for profile data
interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

// Type for last message data
interface LastMessageData {
  content: string;
  created_at: string;
  from_user_id: string;
}

/**
 * GET /api/messages/threads
 * Get all message threads for the current user with last message and unread count
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
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }

    // Cast to proper type
    const threads = threadsData as unknown as MessageThread[] | null;

    if (!threads || threads.length === 0) {
      return NextResponse.json({ threads: [] } as ThreadsResponse);
    }

    // Get other participants' profiles
    const otherParticipantIds = threads.map((t) =>
      t.participant_1 === user.id ? t.participant_2 : t.participant_1
    );

    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', otherParticipantIds);

    const profiles = profilesData as unknown as ProfileData[] | null;
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Get last message and unread count for each thread
    const threadsWithDetails: ThreadWithDetails[] = await Promise.all(
      threads.map(async (thread) => {
        const otherParticipantId =
          thread.participant_1 === user.id ? thread.participant_2 : thread.participant_1;

        // Get last message
        const { data: lastMessagesData } = await supabase
          .from('family_messages')
          .select('content, created_at, from_user_id')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessages = lastMessagesData as unknown as LastMessageData[] | null;

        // Get unread count (messages from other user that haven't been read)
        const { count: unreadCount } = await supabase
          .from('family_messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .eq('from_user_id', otherParticipantId)
          .is('read_at', null);

        const profile = profileMap.get(otherParticipantId);

        return {
          id: thread.id,
          participant_1: thread.participant_1,
          participant_2: thread.participant_2,
          created_at: thread.created_at,
          updated_at: thread.updated_at,
          other_participant: {
            id: otherParticipantId,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            avatar_url: profile?.avatar_url || null,
          },
          last_message: lastMessages?.[0] || null,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ threads: threadsWithDetails } as ThreadsResponse);
  } catch (error) {
    console.error('Error in GET /api/messages/threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/messages/threads
 * Create or get a thread with another user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipient_id } = body;

    if (!recipient_id) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    if (recipient_id === user.id) {
      return NextResponse.json({ error: 'Cannot create thread with yourself' }, { status: 400 });
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Use the database function to get or create thread
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: threadId, error: threadError } = await (supabase.rpc as any)(
      'get_or_create_message_thread',
      { user_a: user.id, user_b: recipient_id }
    );

    if (threadError) {
      console.error('Error creating thread:', threadError);
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    // Fetch the thread details
    const { data: threadData, error: fetchError } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', threadId as string)
      .single();

    if (fetchError || !threadData) {
      return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
    }

    const thread = threadData as unknown as MessageThread;

    return NextResponse.json({ thread } as CreateThreadResponse);
  } catch (error) {
    console.error('Error in POST /api/messages/threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
