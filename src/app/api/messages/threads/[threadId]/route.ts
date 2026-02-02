import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { MessagesResponse, SendMessageResponse, MessageThread, FamilyMessage } from '@/types/messaging';

// Type for profile data
interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

/**
 * GET /api/messages/threads/[threadId]
 * Get messages in a thread
 */
export async function GET(
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

    // Get messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('family_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const messages = (messagesData as unknown as FamilyMessage[]) || [];

    // Get other participant's profile
    const otherParticipantId =
      thread.participant_1 === user.id ? thread.participant_2 : thread.participant_1;

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', otherParticipantId)
      .single();

    const profile = profileData as unknown as ProfileData | null;

    const response: MessagesResponse = {
      messages,
      thread,
      other_participant: {
        id: otherParticipantId,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        avatar_url: profile?.avatar_url || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/messages/threads/[threadId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/messages/threads/[threadId]
 * Send a message in a thread
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

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
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

    // Insert the message - table not in generated types, using 'as any'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messageData, error: messageError } = await (supabase as any)
      .from('family_messages')
      .insert({
        thread_id: threadId,
        from_user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    const message = messageData as unknown as FamilyMessage;

    return NextResponse.json({ message } as SendMessageResponse);
  } catch (error) {
    console.error('Error in POST /api/messages/threads/[threadId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
