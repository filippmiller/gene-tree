/**
 * Family Chat Messages API
 *
 * GET - Get paginated messages for the family chat
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { FamilyChatMessageWithSender } from '@/types/family-chat';

const PAGE_SIZE = 50;

/**
 * GET /api/family-chat/messages
 * Get paginated messages (newest first)
 *
 * Query params:
 * - cursor: ISO timestamp to fetch messages before
 * - limit: Number of messages (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || String(PAGE_SIZE), 10), 100);

    // Get user's chat
    const { data: chatId } = await (supabase.rpc as any)('get_or_create_family_chat', {
      p_user_id: user.id,
    });

    if (!chatId) {
      return NextResponse.json(
        { error: 'Failed to get family chat' },
        { status: 500 }
      );
    }

    // Use RLS-safe function to get messages
    const { data: messages, error } = await (supabase.rpc as any)(
      'get_family_chat_messages',
      {
        p_chat_id: chatId,
        p_cursor: cursor || null,
        p_limit: limit,
      }
    );

    if (error) {
      console.error('[FamilyChat] Failed to fetch messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const hasMore = messages && messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages || [];

    // Transform to expected format with sender object
    const formattedMessages = resultMessages.map((m: any) => ({
      id: m.id,
      chat_id: m.chat_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      metadata: m.metadata,
      memory_source_id: m.memory_source_id,
      is_deleted: m.is_deleted,
      created_at: m.created_at,
      edited_at: m.edited_at,
      sender: m.sender_id ? {
        first_name: m.sender_first_name,
        last_name: m.sender_last_name,
        avatar_url: m.sender_avatar_url,
      } : null,
    }));

    // Reverse to get chronological order (oldest first in the page)
    formattedMessages.reverse();

    return NextResponse.json({
      messages: formattedMessages as FamilyChatMessageWithSender[],
      has_more: hasMore,
      cursor: hasMore ? formattedMessages[0]?.created_at : undefined,
    });
  } catch (error) {
    console.error('[FamilyChat] Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
