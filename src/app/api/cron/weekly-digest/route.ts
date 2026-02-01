/**
 * Weekly Digest Cron Job
 *
 * Runs weekly to send personalized family digest emails.
 * Scheduled to run on each day of the week, but only sends to users
 * who have that day set as their digest_day preference.
 *
 * Content includes:
 * - Upcoming birthdays (next 7 days)
 * - New stories added in the last week
 * - "On this day" memories
 * - Pending invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { gatherDigestContent } from '@/lib/email/digest-content-queries';
import {
  buildDigestSubject,
  buildDigestText,
  buildDigestHtml,
  type WeeklyDigestPayload
} from '@/lib/email/weekly-digest-templates';
import type { DigestDay, EmailPreferences } from '@/types/email-preferences';

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET;

// Get day of week as DigestDay type
function getCurrentDigestDay(): DigestDay {
  const days: DigestDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

// Format date range for display
function getWeekDateRange(): { start: string; end: string } {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    start: format(today),
    end: format(nextWeek)
  };
}

// Send email via Resend
async function sendDigestEmail(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { success: false, error: 'Missing Resend configuration' };
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
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const result = await response.json();
    return { success: true, id: result.id };

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

interface UserForDigest {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_preferences: EmailPreferences | null;
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
  const currentDay = getCurrentDigestDay();
  const { start: weekStart, end: weekEnd } = getWeekDateRange();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.app';

  const stats = {
    day: currentDay,
    users_eligible: 0,
    users_with_content: 0,
    emails_sent: 0,
    emails_skipped: 0,
    errors: [] as string[]
  };

  console.log(`[Weekly Digest] Starting for ${currentDay}...`);

  try {
    // 1. Get all users who have weekly_digest enabled AND digest_day matches today
    // We query email_preferences JSONB column
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: users, error: usersError } = await (admin as any)
      .from('user_profiles')
      .select('id, first_name, last_name, email_preferences')
      .not('email_preferences', 'is', null);

    if (usersError) {
      stats.errors.push(`Failed to fetch users: ${usersError.message}`);
      return NextResponse.json({ success: false, stats }, { status: 500 });
    }

    // Filter users who have digest enabled for today
    const eligibleUsers = ((users || []) as UserForDigest[]).filter((user: UserForDigest) => {
      const prefs = user.email_preferences;
      if (!prefs) return false;
      return prefs.weekly_digest === true && prefs.digest_day === currentDay;
    });

    stats.users_eligible = eligibleUsers.length;

    console.log(`[Weekly Digest] Found ${eligibleUsers.length} eligible users for ${currentDay}`);

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No users have digest enabled for ${currentDay}`,
        stats
      });
    }

    // 2. Process each user
    for (const user of eligibleUsers) {
      try {
        // Get user's email from auth
        const { data: authUser } = await admin.auth.admin.getUserById(user.id);

        if (!authUser?.user?.email) {
          stats.errors.push(`No email for user ${user.id}`);
          continue;
        }

        const userEmail = authUser.user.email;

        // Gather personalized content
        const content = await gatherDigestContent(admin, user.id, userEmail);

        // Check if there's any content worth sending
        const hasContent =
          content.birthdays.length > 0 ||
          content.stories.length > 0 ||
          content.memories.length > 0 ||
          content.pendingInvites.length > 0;

        if (!hasContent) {
          stats.emails_skipped++;
          continue;
        }

        stats.users_with_content++;

        // Build email payload
        const payload: WeeklyDigestPayload = {
          recipientName: user.first_name || '',
          recipientEmail: userEmail,
          familyName: undefined, // Could be enhanced to get family/tree name
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          birthdays: content.birthdays,
          stories: content.stories,
          memories: content.memories,
          pendingInvites: content.pendingInvites,
          appUrl: baseUrl,
          unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?user=${user.id}&token=${generateUnsubscribeToken(user.id)}`
        };

        // Build and send email
        const subject = buildDigestSubject(payload);
        const text = buildDigestText(payload);
        const html = buildDigestHtml(payload);

        const result = await sendDigestEmail(userEmail, subject, text, html);

        if (result.success) {
          stats.emails_sent++;
          console.log(`[Weekly Digest] Sent to ${userEmail}`);
        } else {
          stats.errors.push(`Failed to send to ${userEmail}: ${result.error}`);
        }

      } catch (userError) {
        stats.errors.push(`Error processing user ${user.id}: ${String(userError)}`);
      }
    }

    console.log('[Weekly Digest] Completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Weekly Digest] Fatal error:', error);
    stats.errors.push(String(error));
    return NextResponse.json({ success: false, stats }, { status: 500 });
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Generate a simple unsubscribe token
 * In production, this should be a signed token
 */
function generateUnsubscribeToken(userId: string): string {
  // Simple hash for unsubscribe verification
  // In production, use a proper HMAC or signed token
  const data = `${userId}:${process.env.CRON_SECRET || 'digest'}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
