import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { sendTimeCapsuleNotification } from '@/lib/time-capsules/email-notification';
import { DEFAULT_EMAIL_PREFERENCES } from '@/types/email-preferences';
import type { TimeCapsuleDeliveredPayload } from '@/types/notifications';
import type { Json } from '@/lib/types/supabase';

 
type SupabaseAny = any;

interface TimeCapsuleRow {
  id: string;
  created_by: string;
  recipient_profile_id: string | null;
  title: string;
}

interface CreatorProfile {
  first_name: string;
  last_name: string;
}

/**
 * GET /api/cron/deliver-time-capsules
 * Cron job to deliver due time capsules (runs every 6 hours)
 *
 * Authorization: Vercel Cron or admin API key
 */
export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow Vercel cron or API key auth
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Find all capsules due for delivery
  // Using any type here since time_capsules table is new and not yet in generated types
  const { data: dueCapsules, error: fetchError } = await (admin as SupabaseAny)
    .from('time_capsules')
    .select('id, created_by, recipient_profile_id, title')
    .eq('delivery_status', 'scheduled')
    .lte('scheduled_delivery_date', now)
    .limit(100); // Process in batches

  if (fetchError) {
    console.error('[CRON:TIME_CAPSULES] Fetch error:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch due capsules' }, { status: 500 });
  }

  if (!dueCapsules || dueCapsules.length === 0) {
    return NextResponse.json({
      success: true,
      delivered: 0,
      message: 'No capsules due for delivery',
    });
  }

  let deliveredCount = 0;
  const errors: string[] = [];

  for (const capsule of dueCapsules as TimeCapsuleRow[]) {
    try {
      // Update capsule status to delivered
      const { error: updateError } = await (admin as SupabaseAny)
        .from('time_capsules')
        .update({
          delivery_status: 'delivered',
          delivered_at: now,
        })
        .eq('id', capsule.id);

      if (updateError) {
        console.error(`[CRON:TIME_CAPSULES] Failed to deliver ${capsule.id}:`, updateError);
        errors.push(capsule.id);
        continue;
      }

      // Get creator's name for the notification
      const { data: creator } = await admin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', capsule.created_by)
        .single();

      const creatorProfile = creator as CreatorProfile | null;
      const creatorName = creatorProfile
        ? `${creatorProfile.first_name} ${creatorProfile.last_name}`
        : 'A family member';

      // Determine recipients: specific person or family broadcast
      let recipientIds: string[] = [];

      if (capsule.recipient_profile_id) {
        // Specific recipient
        recipientIds = [capsule.recipient_profile_id];
      } else {
        // Family broadcast - get all family circle members
        const { data: familyMembers, error: familyError } = await admin.rpc(
          'get_family_circle_profile_ids',
          { p_user_id: capsule.created_by }
        );

        if (familyError) {
          console.error(`[CRON:TIME_CAPSULES] Failed to get family circle for ${capsule.created_by}:`, familyError);
        } else if (familyMembers && familyMembers.length > 0) {
          // Exclude the creator from recipients (don't notify yourself)
          recipientIds = familyMembers
            .map((m: { profile_id: string }) => m.profile_id)
            .filter((id: string) => id !== capsule.created_by);
          console.log(`[CRON:TIME_CAPSULES] Broadcasting capsule ${capsule.id} to ${recipientIds.length} family members`);
        }
      }

      // Send notifications to all recipients
      for (const recipientId of recipientIds) {
        const payload: TimeCapsuleDeliveredPayload = {
          capsule_id: capsule.id,
          title: capsule.title,
          creator_name: creatorName,
          is_broadcast: !capsule.recipient_profile_id,
        };

        // Create notification for the recipient
        const { data: notif, error: notifError } = await admin
          .from('notifications')
          .insert({
            event_type: 'TIME_CAPSULE_DELIVERED',
            actor_profile_id: capsule.created_by,
            primary_profile_id: recipientId,
            payload: payload as unknown as Json,
          })
          .select('id')
          .single();

        if (!notifError && notif) {
          // Create recipient entry
          await admin
            .from('notification_recipients')
            .insert({
              notification_id: notif.id,
              profile_id: recipientId,
            });
        }

        // Send email notification if enabled
        const { data: recipientProfile } = await admin
          .from('user_profiles')
          .select('first_name, email_preferences')
          .eq('id', recipientId)
          .single();

        // Get recipient's email from auth.users
        const { data: authUser } = await admin.auth.admin.getUserById(recipientId);

        if (recipientProfile && authUser?.user?.email) {
          const savedPrefs = typeof recipientProfile.email_preferences === 'object'
            ? (recipientProfile.email_preferences as Record<string, unknown>)
            : {};
          const emailPrefs = {
            ...DEFAULT_EMAIL_PREFERENCES,
            ...savedPrefs,
          };

          // Only send if user has time capsule notifications enabled
          if (emailPrefs.time_capsule_notifications !== false) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.com';
            const viewUrl = `${baseUrl}/time-capsules?capsule=${capsule.id}`;

            await sendTimeCapsuleNotification({
              to: authUser.user.email,
              recipientName: recipientProfile.first_name || 'there',
              senderName: creatorName,
              capsuleTitle: capsule.title,
              viewUrl,
              locale: 'en', // TODO: Get from recipient profile
            });
          }
        }
      }

      deliveredCount++;
      console.log(`[CRON:TIME_CAPSULES] Delivered capsule ${capsule.id} to ${capsule.recipient_profile_id || 'family'}`);
    } catch (err) {
      console.error(`[CRON:TIME_CAPSULES] Error delivering ${capsule.id}:`, err);
      errors.push(capsule.id);
    }
  }

  return NextResponse.json({
    success: true,
    delivered: deliveredCount,
    errors: errors.length > 0 ? errors : undefined,
    message: `Delivered ${deliveredCount} time capsule(s)`,
  });
}
