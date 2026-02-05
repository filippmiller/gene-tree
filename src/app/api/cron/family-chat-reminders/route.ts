/**
 * Family Chat Reminders Cron Job
 *
 * Runs daily to post system messages to family chats:
 * - Birthday reminders
 * - Anniversary reminders
 * - Memorial reminders
 * - "On This Day" memories from previous years
 *
 * NOTE: After running the migration, regenerate Supabase types:
 * npx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { Json } from '@/lib/types/supabase';
import { SYSTEM_MESSAGE_TEMPLATES } from '@/types/family-chat';

// Vercel Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET;

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  death_date: string | null;
  is_living: boolean | null;
}

interface SpouseRelationship {
  invited_by: string;
  related_to_user_id: string | null;
  marriage_date: string | null;
  first_name: string;
  last_name: string;
}

// Helper to check if date matches today (ignoring year)
function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  );
}

// Calculate age/years
function calculateYears(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    years--;
  }

  return years;
}

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const admin = getSupabaseAdmin();

  const stats = {
    chats_processed: 0,
    birthday_messages: 0,
    anniversary_messages: 0,
    memorial_messages: 0,
    memory_messages: 0,
    errors: [] as string[],
  };

  try {
    // Get all active family chats
    const { data: chats, error: chatsError } = await (admin as any)
      .from('family_group_chats')
      .select('id, tree_root_user_id')
      .eq('is_active', true);

    if (chatsError) {
      stats.errors.push(`Failed to fetch chats: ${chatsError.message}`);
      return NextResponse.json({ success: false, stats }, { status: 500 });
    }

    for (const chat of chats || []) {
      stats.chats_processed++;

      try {
        // Get family members for this chat
        const { data: members } = await (admin as any)
          .from('family_chat_members')
          .select('user_id')
          .eq('chat_id', chat.id);

        const memberIds = (members || []).map((m: any) => m.user_id);

        if (memberIds.length === 0) continue;

        // Get profiles of all members
        const { data: profiles } = (await admin
          .from('user_profiles')
          .select('id, first_name, last_name, birth_date, death_date, is_living')
          .in('id', memberIds)) as { data: UserProfile[] | null };

        // 1. Birthday messages
        for (const profile of profiles || []) {
          if (!profile.birth_date || profile.is_living === false) continue;

          if (isToday(profile.birth_date)) {
            const age = calculateYears(profile.birth_date);
            const name = `${profile.first_name} ${profile.last_name}`;

            // Check if we already posted today
            const { data: existing } = await (admin as any)
              .from('family_chat_messages')
              .select('id')
              .eq('chat_id', chat.id)
              .eq('message_type', 'birthday')
              .gte('created_at', new Date().toISOString().split('T')[0])
              .limit(1);

            if (existing && existing.length > 0) continue;

            await (admin as any).from('family_chat_messages').insert({
              chat_id: chat.id,
              message_type: 'birthday',
              content: SYSTEM_MESSAGE_TEMPLATES.birthday(name, age),
              metadata: {
                person_id: profile.id,
                person_name: name,
                age,
              } as unknown as Json,
            });

            stats.birthday_messages++;
          }
        }

        // 2. Anniversary messages (from spouse relationships)
        const { data: spouseRelations } = (await admin
          .from('pending_relatives')
          .select(
            'invited_by, related_to_user_id, marriage_date, first_name, last_name'
          )
          .eq('relationship_type', 'spouse')
          .eq('is_verified', true)
          .not('marriage_date', 'is', null)
          .in('invited_by', memberIds)) as {
          data: SpouseRelationship[] | null;
        };

        for (const relation of spouseRelations || []) {
          if (!relation.marriage_date) continue;

          if (isToday(relation.marriage_date)) {
            const years = calculateYears(relation.marriage_date);

            // Get person1 name
            const person1 = profiles?.find((p) => p.id === relation.invited_by);
            if (!person1) continue;

            // Get person2 name
            let person2Name = `${relation.first_name} ${relation.last_name}`;
            if (relation.related_to_user_id) {
              const person2 = profiles?.find(
                (p) => p.id === relation.related_to_user_id
              );
              if (person2) {
                person2Name = `${person2.first_name} ${person2.last_name}`;
              }
            }

            const person1Name = `${person1.first_name} ${person1.last_name}`;

            await (admin as any).from('family_chat_messages').insert({
              chat_id: chat.id,
              message_type: 'anniversary',
              content: SYSTEM_MESSAGE_TEMPLATES.anniversary(
                person1Name,
                person2Name,
                years
              ),
              metadata: {
                person1_id: relation.invited_by,
                person1_name: person1Name,
                person2_id: relation.related_to_user_id,
                person2_name: person2Name,
                years_married: years,
              } as unknown as Json,
            });

            stats.anniversary_messages++;
          }
        }

        // 3. Memorial messages
        for (const profile of profiles || []) {
          if (!profile.death_date || profile.is_living !== false) continue;

          if (isToday(profile.death_date)) {
            const years = calculateYears(profile.death_date);
            const name = `${profile.first_name} ${profile.last_name}`;

            await (admin as any).from('family_chat_messages').insert({
              chat_id: chat.id,
              message_type: 'memorial',
              content: SYSTEM_MESSAGE_TEMPLATES.memorial(name, years),
              metadata: {
                person_id: profile.id,
                person_name: name,
                years_since: years,
              } as unknown as Json,
            });

            stats.memorial_messages++;
          }
        }

        // 4. "On This Day" memories
        const { data: memories } = await (admin.rpc as any)('get_on_this_day_messages', {
          p_chat_id: chat.id,
          p_min_years_ago: 1,
        });

        for (const memory of memories || []) {
          // Only post one memory per day
          const { data: existingMemory } = await (admin as any)
            .from('family_chat_messages')
            .select('id')
            .eq('chat_id', chat.id)
            .eq('message_type', 'memory')
            .gte('created_at', new Date().toISOString().split('T')[0])
            .limit(1);

          if (existingMemory && existingMemory.length > 0) break;

          const truncatedContent =
            memory.content.length > 200
              ? memory.content.substring(0, 200) + '...'
              : memory.content;

          await (admin as any).from('family_chat_messages').insert({
            chat_id: chat.id,
            message_type: 'memory',
            content: SYSTEM_MESSAGE_TEMPLATES.memory(
              truncatedContent,
              memory.sender_name || 'Someone',
              memory.years_ago
            ),
            metadata: {
              original_message_id: memory.message_id,
              original_date: memory.created_at,
              years_ago: memory.years_ago,
              original_sender_name: memory.sender_name,
            } as unknown as Json,
            memory_source_id: memory.message_id,
          });

          stats.memory_messages++;
          break; // Only one memory per day
        }
      } catch (chatError) {
        stats.errors.push(
          `Error processing chat ${chat.id}: ${String(chatError)}`
        );
      }
    }

    console.log('[Family Chat Reminders] Completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Family Chat Reminders] Fatal error:', error);
    stats.errors.push(String(error));
    return NextResponse.json({ success: false, stats }, { status: 500 });
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return GET(request);
}
