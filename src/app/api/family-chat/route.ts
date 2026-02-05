/**
 * Family Group Chat API
 *
 * GET  - Get user's family chat with details
 * POST - Send a message to the family chat
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  FamilyChatWithDetails,
  FamilyChatMemberWithProfile,
  FamilyChatMember,
  FamilyChatMessageWithSender,
  SendMessageRequest,
} from '@/types/family-chat';

/**
 * GET /api/family-chat
 * Get the current user's family chat with details
 */
export async function GET() {
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get or create the family chat for this user
    const { data: chatId, error: chatIdError } = await (supabase.rpc as any)(
      'get_or_create_family_chat',
      { p_user_id: user.id }
    );

    if (chatIdError || !chatId) {
      console.error('[FamilyChat] Failed to get/create chat:', chatIdError);
      return NextResponse.json(
        { error: 'Failed to get family chat' },
        { status: 500 }
      );
    }

    // Sync family members to the chat
    await (supabase.rpc as any)('sync_family_chat_members', { p_chat_id: chatId });

    // Get chat details
    const { data: chat, error: chatError } = await (supabase as any)
      .from('family_group_chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      console.error('[FamilyChat] Failed to fetch chat:', chatError);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get members with profiles using RLS-safe function
    const { data: members, error: membersError } = await (supabase.rpc as any)(
      'get_family_chat_members',
      { p_chat_id: chatId }
    );

    if (membersError) {
      console.error('[FamilyChat] Failed to fetch members:', membersError);
    }

    // Transform to expected format
    const membersWithProfile = (members || []).map((m: any) => ({
      ...m,
      profile: {
        first_name: m.first_name,
        last_name: m.last_name,
        avatar_url: m.avatar_url,
      },
    }));

    // Get current user's membership
    const currentMember = (membersWithProfile || []).find((m: any) => m.user_id === user.id);

    if (!currentMember) {
      return NextResponse.json(
        { error: 'You are not a member of this chat' },
        { status: 403 }
      );
    }

    // Get unread count
    const { data: unreadCount } = await (supabase.rpc as any)('get_chat_unread_count', {
      p_chat_id: chatId,
      p_user_id: user.id,
    });

    // Get last message
    const { data: lastMessages } = await (supabase as any)
      .from('family_chat_messages')
      .select(
        `
        content,
        message_type,
        created_at,
        sender:user_profiles(first_name, last_name)
      `
      )
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMessage = lastMessages?.[0];

    const chatWithDetails: FamilyChatWithDetails = {
      ...chat,
      unread_count: unreadCount || 0,
      member_count: (membersWithProfile || []).length,
      last_message: lastMessage
        ? {
            content: lastMessage.content,
            sender_name: lastMessage.sender
              ? `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`
              : null,
            created_at: lastMessage.created_at,
            message_type: lastMessage.message_type,
          }
        : undefined,
    };

    return NextResponse.json({
      chat: chatWithDetails,
      members: membersWithProfile as FamilyChatMemberWithProfile[],
      current_member: currentMember as FamilyChatMember,
    });
  } catch (error) {
    console.error('[FamilyChat] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family-chat
 * Send a message to the family chat
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
    const body: SendMessageRequest = await request.json();

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const content = body.content.trim();

    if (content.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

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

    // Check if user is a member and not muted
    const { data: membership } = await (supabase as any)
      .from('family_chat_members')
      .select('is_muted, muted_until')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this chat' },
        { status: 403 }
      );
    }

    if (membership.is_muted) {
      if (!membership.muted_until || new Date(membership.muted_until) > new Date()) {
        return NextResponse.json(
          { error: 'You are muted and cannot send messages' },
          { status: 403 }
        );
      }
    }

    // Insert the message
    const { data: message, error: insertError } = await (supabase as any)
      .from('family_chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
        message_type: 'user',
      })
      .select(
        `
        *,
        sender:user_profiles(first_name, last_name, avatar_url)
      `
      )
      .single();

    if (insertError || !message) {
      console.error('[FamilyChat] Failed to send message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Update user's last_read_at
    await (supabase as any)
      .from('family_chat_members')
      .update({
        last_read_at: new Date().toISOString(),
        last_read_message_id: message.id,
      })
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    return NextResponse.json({
      message: message as FamilyChatMessageWithSender,
    });
  } catch (error) {
    console.error('[FamilyChat] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
