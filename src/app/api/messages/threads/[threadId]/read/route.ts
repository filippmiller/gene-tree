import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { MessageThread } from '@/types/messaging';

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

/**
 * POST /api/messages/threads/[threadId]/read
 * Mark all unread messages in a thread as read
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await getSupabaseSSR();
    const { threadId } = await context.params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a participant in this thread
    const { data: threadData, error: threadError } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', threadId)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single();

    if (threadError || !threadData) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const thread = threadData as unknown as MessageThread;

    // Get the other participant ID
    const otherParticipantId =
      thread.participant_1 === user.id ? thread.participant_2 : thread.participant_1;

    // Mark all unread messages from the other user as read
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('family_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('from_user_id', otherParticipantId)
      .is('read_at', null);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/messages/threads/[threadId]/read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
