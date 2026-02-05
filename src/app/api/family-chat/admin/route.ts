/**
 * Family Chat Admin API
 *
 * POST - Admin actions (mute, role change, delete message)
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  AdminMuteRequest,
  AdminRoleRequest,
  AdminDeleteMessageRequest,
  FamilyChatRole,
} from '@/types/family-chat';

type AdminAction =
  | { action: 'mute'; data: AdminMuteRequest }
  | { action: 'set_role'; data: AdminRoleRequest }
  | { action: 'delete_message'; data: AdminDeleteMessageRequest };

/**
 * POST /api/family-chat/admin
 * Perform admin action
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
    const body: AdminAction = await request.json();

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

    // Verify user is admin
    const { data: membership } = await (supabase as any)
      .from('family_chat_members')
      .select('role')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    switch (body.action) {
      case 'mute': {
        const { user_id, muted, duration_hours } = body.data;

        if (!user_id) {
          return NextResponse.json(
            { error: 'user_id is required' },
            { status: 400 }
          );
        }

        // Can't mute yourself
        if (user_id === user.id) {
          return NextResponse.json(
            { error: 'Cannot mute yourself' },
            { status: 400 }
          );
        }

        const updateData: Record<string, unknown> = {
          is_muted: muted,
        };

        if (muted && duration_hours) {
          const mutedUntil = new Date();
          mutedUntil.setHours(mutedUntil.getHours() + duration_hours);
          updateData.muted_until = mutedUntil.toISOString();
        } else if (!muted) {
          updateData.muted_until = null;
        }

        const { error } = await (supabase as any)
          .from('family_chat_members')
          .update(updateData)
          .eq('chat_id', chatId)
          .eq('user_id', user_id);

        if (error) {
          console.error('[FamilyChat Admin] Mute error:', error);
          return NextResponse.json(
            { error: 'Failed to update mute status' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, action: 'mute', user_id });
      }

      case 'set_role': {
        const { user_id, role } = body.data;

        if (!user_id || !role) {
          return NextResponse.json(
            { error: 'user_id and role are required' },
            { status: 400 }
          );
        }

        if (!['admin', 'member'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }

        // Can't change your own role
        if (user_id === user.id) {
          return NextResponse.json(
            { error: 'Cannot change your own role' },
            { status: 400 }
          );
        }

        const { error } = await (supabase as any)
          .from('family_chat_members')
          .update({ role })
          .eq('chat_id', chatId)
          .eq('user_id', user_id);

        if (error) {
          console.error('[FamilyChat Admin] Set role error:', error);
          return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, action: 'set_role', user_id, role });
      }

      case 'delete_message': {
        const { message_id } = body.data;

        if (!message_id) {
          return NextResponse.json(
            { error: 'message_id is required' },
            { status: 400 }
          );
        }

        const { error } = await (supabase as any)
          .from('family_chat_messages')
          .update({
            is_deleted: true,
            deleted_by: user.id,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', message_id)
          .eq('chat_id', chatId);

        if (error) {
          console.error('[FamilyChat Admin] Delete message error:', error);
          return NextResponse.json(
            { error: 'Failed to delete message' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, action: 'delete_message', message_id });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[FamilyChat Admin] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
