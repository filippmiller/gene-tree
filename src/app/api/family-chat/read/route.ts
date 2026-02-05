/**
 * Mark Messages as Read API
 *
 * POST - Mark messages as read up to a specific message or current time
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { MarkReadRequest } from '@/types/family-chat';

/**
 * POST /api/family-chat/read
 * Mark messages as read
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: MarkReadRequest = await request.json().catch(() => ({}));

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

    // Update last_read_at
    const updateData: Record<string, unknown> = {
      last_read_at: new Date().toISOString(),
    };

    if (body.message_id) {
      updateData.last_read_message_id = body.message_id;
    }

    const { error: updateError } = await (supabase as any)
      .from('family_chat_members')
      .update(updateData)
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[FamilyChat] Failed to mark as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FamilyChat] Read POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
