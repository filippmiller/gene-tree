/**
 * Daily Nudges Cron Job
 *
 * Runs daily to check for:
 * - Upcoming birthdays (today, tomorrow, this week)
 * - Wedding anniversaries
 * - Death memorial dates
 *
 * Creates in-app notifications and sends email reminders
 * to family members who have opted in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { Json } from '@/lib/types/supabase';
import type {
  BirthdayReminderPayload,
  AnniversaryReminderPayload,
  MemorialReminderPayload,
} from '@/types/notifications';
import {
  buildBirthdaySubject,
  buildBirthdayText,
  buildBirthdayHtml,
  buildAnniversarySubject,
  buildAnniversaryText,
  buildAnniversaryHtml,
  buildMemorialSubject,
  buildMemorialText,
  buildMemorialHtml,
} from '@/lib/email/nudge-templates';

// Vercel Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET;

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  death_date: string | null;
  is_living: boolean | null;
  email_preferences: {
    birthday_reminders?: boolean;
    anniversary_reminders?: boolean;
    death_commemorations?: boolean;
  } | null;
}

interface SpouseRelationship {
  invited_by: string;
  id: string;
  marriage_date: string | null;
  person1_first_name: string;
  person1_last_name: string;
  person2_first_name: string;
  person2_last_name: string;
}

interface FamilyMember {
  profile_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  email_preferences: UserProfile['email_preferences'];
}

// Helper to check if date matches today (ignoring year)
function isDateMatch(dateStr: string, targetDate: Date): boolean {
  const date = new Date(dateStr);
  return date.getMonth() === targetDate.getMonth() && date.getDate() === targetDate.getDate();
}

// Helper to get days until date (ignoring year, handling year wrap)
function getDaysUntil(dateStr: string, fromDate: Date): number {
  const date = new Date(dateStr);
  const thisYear = fromDate.getFullYear();

  // Create date for this year
  let targetDate = new Date(thisYear, date.getMonth(), date.getDate());

  // If date has passed this year, check next year
  if (targetDate < fromDate) {
    targetDate = new Date(thisYear + 1, date.getMonth(), date.getDate());
  }

  const diffTime = targetDate.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate age or years
function calculateYears(dateStr: string, referenceDate: Date): number {
  const date = new Date(dateStr);
  let years = referenceDate.getFullYear() - date.getFullYear();
  const monthDiff = referenceDate.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < date.getDate())) {
    years--;
  }

  return years;
}

// Send email via Resend
async function sendNudgeEmail(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log('[Daily Nudges] Skipping email - missing Resend config');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error('[Daily Nudges] Email send failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Daily Nudges] Email send error:', error);
    return false;
  }
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    birthdays_today: 0,
    birthdays_upcoming: 0,
    anniversaries: 0,
    memorials: 0,
    notifications_created: 0,
    emails_sent: 0,
    errors: [] as string[],
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.app';

  // Helper to check if notification already exists today
  async function hasNotificationToday(
    eventType: string,
    primaryProfileId: string,
    daysUntil: number
  ): Promise<boolean> {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const { data } = await admin
      .from('notifications')
      .select('id')
      .eq('event_type', eventType)
      .eq('primary_profile_id', primaryProfileId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .limit(1);

    // Also check payload for days_until to avoid duplicate reminders for same occasion
    if (data && data.length > 0) {
      return true;
    }

    return false;
  }

  try {
    // 1. Fetch all profiles with birth dates
    // Note: Using explicit column list and casting to handle type generation lag
    const { data: profiles, error: profilesError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, birth_date, death_date, is_living, email_preferences')
      .not('birth_date', 'is', null) as unknown as {
        data: UserProfile[] | null;
        error: { message: string } | null
      };

    if (profilesError) {
      stats.errors.push(`Failed to fetch profiles: ${profilesError.message}`);
      return NextResponse.json({ success: false, stats }, { status: 500 });
    }

    // 2. Process birthdays
    for (const profile of profiles || []) {
      if (!profile.birth_date) continue;

      // Skip deceased profiles for birthday reminders
      if (profile.is_living === false) continue;

      const daysUntil = getDaysUntil(profile.birth_date, today);

      // Only notify for today, tomorrow, or 7 days out
      if (daysUntil !== 0 && daysUntil !== 1 && daysUntil !== 7) continue;

      const eventType = daysUntil === 0 ? 'BIRTHDAY_TODAY' : 'BIRTHDAY_REMINDER';

      // Check for duplicate notification
      const alreadySent = await hasNotificationToday(eventType, profile.id, daysUntil);
      if (alreadySent) {
        continue;
      }

      const age = calculateYears(profile.birth_date, today) + (daysUntil === 0 ? 0 : 1);

      const payload: BirthdayReminderPayload = {
        person_id: profile.id,
        person_name: `${profile.first_name} ${profile.last_name}`,
        birth_date: profile.birth_date,
        age,
        days_until: daysUntil,
      };

      // Get family circle members to notify
      const { data: familyMembers, error: familyError } = await admin.rpc(
        'get_family_circle_profile_ids',
        { p_user_id: profile.id }
      );

      if (familyError) {
        stats.errors.push(`Failed to get family for ${profile.id}: ${familyError.message}`);
        continue;
      }

      // Create notification
      const { data: notification, error: notifError } = await admin
        .from('notifications')
        .insert({
          event_type: eventType,
          actor_profile_id: profile.id,
          primary_profile_id: profile.id,
          payload: payload as unknown as Json,
        })
        .select('id')
        .single();

      if (notifError || !notification) {
        stats.errors.push(`Failed to create notification: ${notifError?.message}`);
        continue;
      }

      // Fan out to family members
      const recipientRows = ((familyMembers as { profile_id: string }[]) || [])
        .filter((m) => m.profile_id !== profile.id) // Don't notify the birthday person
        .map((m) => ({
          notification_id: notification.id,
          profile_id: m.profile_id,
        }));

      if (recipientRows.length > 0) {
        await admin.from('notification_recipients').insert(recipientRows);
        stats.notifications_created += recipientRows.length;
      }

      if (daysUntil === 0) {
        stats.birthdays_today++;
      } else {
        stats.birthdays_upcoming++;
      }

      // Send emails to family members who have opted in
      for (const member of (familyMembers as { profile_id: string }[]) || []) {
        if (member.profile_id === profile.id) continue;

        // Get member's email and preferences
        const { data: memberData } = await admin
          .from('user_profiles')
          .select('first_name, email_preferences')
          .eq('id', member.profile_id)
          .single() as unknown as { data: FamilyMember | null };

        // Get email from auth.users
        const { data: authUser } = await admin.auth.admin.getUserById(member.profile_id);

        if (
          !authUser?.user?.email ||
          !memberData?.email_preferences?.birthday_reminders
        ) {
          continue;
        }

        const emailPayload = {
          recipientName: memberData?.first_name || '',
          personName: `${profile.first_name} ${profile.last_name}`,
          age,
          daysUntil,
          profileUrl: `${baseUrl}/profile/${profile.id}`,
        };

        const sent = await sendNudgeEmail(
          authUser.user.email,
          buildBirthdaySubject(emailPayload.personName, daysUntil),
          buildBirthdayText(emailPayload),
          buildBirthdayHtml(emailPayload)
        );

        if (sent) stats.emails_sent++;
      }
    }

    // 3. Process anniversaries from pending_relatives (spouse relationships)
    const { data: spouseRelations, error: spouseError } = await admin
      .from('pending_relatives')
      .select(
        `
        invited_by,
        id,
        marriage_date,
        first_name,
        last_name
      `
      )
      .eq('relationship_type', 'spouse')
      .not('marriage_date', 'is', null)
      .eq('is_verified', true);

    if (spouseError) {
      stats.errors.push(`Failed to fetch spouse relations: ${spouseError.message}`);
    } else {
      for (const relation of spouseRelations || []) {
        if (!relation.marriage_date || !relation.invited_by) continue;

        const daysUntil = getDaysUntil(relation.marriage_date, today);

        // Only notify for today, tomorrow, or 7 days out
        if (daysUntil !== 0 && daysUntil !== 1 && daysUntil !== 7) continue;

        // Check for duplicate notification
        const alreadySent = await hasNotificationToday('ANNIVERSARY_REMINDER', relation.invited_by, daysUntil);
        if (alreadySent) {
          continue;
        }

        // Get person1 details
        const { data: person1 } = await admin
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', relation.invited_by)
          .single();

        if (!person1) continue;

        const yearsMarried = calculateYears(relation.marriage_date, today) + (daysUntil === 0 ? 0 : 1);

        const payload: AnniversaryReminderPayload = {
          person1_id: relation.invited_by,
          person2_id: relation.id,
          person1_name: `${person1.first_name} ${person1.last_name}`,
          person2_name: `${relation.first_name} ${relation.last_name}`,
          marriage_date: relation.marriage_date,
          years_married: yearsMarried,
          days_until: daysUntil,
        };

        // Create notification
        const { data: notification, error: notifError } = await admin
          .from('notifications')
          .insert({
            event_type: 'ANNIVERSARY_REMINDER',
            actor_profile_id: relation.invited_by,
            primary_profile_id: relation.invited_by,
            related_profile_id: relation.id,
            payload: payload as unknown as Json,
          })
          .select('id')
          .single();

        if (notifError || !notification) {
          stats.errors.push(`Failed to create anniversary notification: ${notifError?.message}`);
          continue;
        }

        // Get family members of both spouses
        const { data: family1 } = await admin.rpc('get_family_circle_profile_ids', {
          p_user_id: relation.invited_by,
        });
        const { data: family2 } = await admin.rpc('get_family_circle_profile_ids', {
          p_user_id: relation.id,
        });

        const allFamily = new Set<string>();
        for (const m of (family1 as { profile_id: string }[]) || []) {
          allFamily.add(m.profile_id);
        }
        for (const m of (family2 as { profile_id: string }[]) || []) {
          allFamily.add(m.profile_id);
        }

        const recipientRows = Array.from(allFamily).map((profileId) => ({
          notification_id: notification.id,
          profile_id: profileId,
        }));

        if (recipientRows.length > 0) {
          await admin.from('notification_recipients').insert(recipientRows);
          stats.notifications_created += recipientRows.length;
        }

        stats.anniversaries++;

        // Send emails to family members who have opted in
        for (const profileId of allFamily) {
          const { data: memberData } = await admin
            .from('user_profiles')
            .select('first_name, email_preferences')
            .eq('id', profileId)
            .single() as unknown as { data: FamilyMember | null };

          const { data: authUser } = await admin.auth.admin.getUserById(profileId);

          if (
            !authUser?.user?.email ||
            !memberData?.email_preferences?.anniversary_reminders
          ) {
            continue;
          }

          const emailPayload = {
            recipientName: memberData?.first_name || '',
            person1Name: payload.person1_name,
            person2Name: payload.person2_name,
            yearsMarried,
            daysUntil,
            profileUrl: `${baseUrl}/profile/${relation.invited_by}`,
          };

          const sent = await sendNudgeEmail(
            authUser.user.email,
            buildAnniversarySubject(payload.person1_name, payload.person2_name, daysUntil),
            buildAnniversaryText(emailPayload),
            buildAnniversaryHtml(emailPayload)
          );

          if (sent) stats.emails_sent++;
        }
      }
    }

    // 4. Process memorials (death anniversaries)
    const { data: deceasedProfiles, error: deceasedError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, death_date, email_preferences')
      .eq('is_living', false)
      .not('death_date', 'is', null) as unknown as {
        data: UserProfile[] | null;
        error: { message: string } | null
      };

    if (deceasedError) {
      stats.errors.push(`Failed to fetch deceased profiles: ${deceasedError.message}`);
    } else {
      for (const profile of deceasedProfiles || []) {
        if (!profile.death_date) continue;

        const daysUntil = getDaysUntil(profile.death_date, today);

        // Only notify on the actual memorial date
        if (daysUntil !== 0) continue;

        // Check for duplicate notification
        const alreadySent = await hasNotificationToday('MEMORIAL_REMINDER', profile.id, daysUntil);
        if (alreadySent) {
          continue;
        }

        const yearsSince = calculateYears(profile.death_date, today);

        const payload: MemorialReminderPayload = {
          person_id: profile.id,
          person_name: `${profile.first_name} ${profile.last_name}`,
          death_date: profile.death_date,
          years_since: yearsSince,
          days_until: 0,
        };

        // Create notification
        const { data: notification, error: notifError } = await admin
          .from('notifications')
          .insert({
            event_type: 'MEMORIAL_REMINDER',
            actor_profile_id: profile.id,
            primary_profile_id: profile.id,
            payload: payload as unknown as Json,
          })
          .select('id')
          .single();

        if (notifError || !notification) {
          stats.errors.push(`Failed to create memorial notification: ${notifError?.message}`);
          continue;
        }

        // Get family circle
        const { data: familyMembers } = await admin.rpc('get_family_circle_profile_ids', {
          p_user_id: profile.id,
        });

        const recipientRows = ((familyMembers as { profile_id: string }[]) || []).map((m) => ({
          notification_id: notification.id,
          profile_id: m.profile_id,
        }));

        if (recipientRows.length > 0) {
          await admin.from('notification_recipients').insert(recipientRows);
          stats.notifications_created += recipientRows.length;
        }

        stats.memorials++;

        // Send memorial emails
        for (const member of (familyMembers as { profile_id: string }[]) || []) {
          const { data: memberData } = await admin
            .from('user_profiles')
            .select('first_name, email_preferences')
            .eq('id', member.profile_id)
            .single() as unknown as { data: FamilyMember | null };

          const { data: authUser } = await admin.auth.admin.getUserById(member.profile_id);

          if (
            !authUser?.user?.email ||
            !memberData?.email_preferences?.death_commemorations
          ) {
            continue;
          }

          const emailPayload = {
            recipientName: memberData?.first_name || '',
            personName: `${profile.first_name} ${profile.last_name}`,
            yearsSince,
            tributeUrl: `${baseUrl}/tribute/${profile.id}`,
          };

          const sent = await sendNudgeEmail(
            authUser.user.email,
            buildMemorialSubject(emailPayload.personName),
            buildMemorialText(emailPayload),
            buildMemorialHtml(emailPayload)
          );

          if (sent) stats.emails_sent++;
        }
      }
    }

    console.log('[Daily Nudges] Completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Daily Nudges] Fatal error:', error);
    stats.errors.push(String(error));
    return NextResponse.json({ success: false, stats }, { status: 500 });
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return GET(request);
}
