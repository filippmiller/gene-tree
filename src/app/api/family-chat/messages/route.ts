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

    // Check membership
    const { data: membership } = await (supabase as any)
      .from('family_chat_members')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this chat' },
        { status: 403 }
      );
    }

    // Build query
    let query = (supabase as any)
      .from('family_chat_messages')
      .select(
        `
        *,
        sender:user_profiles(first_name, last_name, avatar_url)
      `
      )
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[FamilyChat] Failed to fetch messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    const hasMore = messages && messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages || [];

    // Reverse to get chronological order (oldest first in the page)
    resultMessages.reverse();

    return NextResponse.json({
      messages: resultMessages as FamilyChatMessageWithSender[],
      has_more: hasMore,
      cursor: hasMore ? resultMessages[0]?.created_at : undefined,
    });
  } catch (error) {
    console.error('[FamilyChat] Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
