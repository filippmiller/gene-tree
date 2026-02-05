/**
 * Chat Preferences API
 *
 * GET   - Get current user's chat preferences
 * PATCH - Update notification preferences
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { UpdatePreferencesRequest } from '@/types/family-chat';

/**
 * GET /api/family-chat/preferences
 * Get current user's chat preferences
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

    const { data: member, error } = await (supabase as any)
      .from('family_chat_members')
      .select('notifications_enabled, email_notifications, is_muted, muted_until')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      preferences: {
        notifications_enabled: member.notifications_enabled,
        email_notifications: member.email_notifications,
        is_muted: member.is_muted,
        muted_until: member.muted_until,
      },
    });
  } catch (error) {
    console.error('[FamilyChat] Preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/family-chat/preferences
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: UpdatePreferencesRequest = await request.json();

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

    // Build update object
    const updateData: Record<string, boolean> = {};

    if (typeof body.notifications_enabled === 'boolean') {
      updateData.notifications_enabled = body.notifications_enabled;
    }

    if (typeof body.email_notifications === 'boolean') {
      updateData.email_notifications = body.email_notifications;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid preferences to update' },
        { status: 400 }
      );
    }

    const { data: member, error } = await (supabase as any)
      .from('family_chat_members')
      .update(updateData)
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .select('notifications_enabled, email_notifications')
      .single();

    if (error) {
      console.error('[FamilyChat] Preferences update error:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: member });
  } catch (error) {
    console.error('[FamilyChat] Preferences PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
