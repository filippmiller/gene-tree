/**
 * Weekly Story Prompts Cron Job
 *
 * Sends personalized story prompts to users who have enabled weekly prompts.
 * Schedule: Every Monday at 9 AM UTC
 *
 * Vercel cron config in vercel.json:
 * { "path": "/api/cron/weekly-prompts", "schedule": "0 9 * * 1" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  StoryPromptEmailPayload,
  buildPromptSubject,
  buildPromptText,
  buildPromptHtml,
} from '@/lib/email/story-prompt-templates';

interface UserWithPromptPrefs {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_locale: string;
  email_preferences: {
    weekly_prompts?: boolean;
  } | null;
}

export async function GET(request: NextRequest) {
  // For Vercel cron - verify authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleWeeklyPrompts();
}

export async function POST(request: NextRequest) {
  // Allow POST for manual triggering in development
  return handleWeeklyPrompts();
}

async function handleWeeklyPrompts() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'prompts@gene-tree.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.com';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Weekly Prompts] Missing Supabase configuration');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Stats tracking
  const stats = {
    users_eligible: 0,
    emails_sent: 0,
    errors: [] as string[],
  };

  try {
    // Get users who have weekly prompts enabled
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email:auth_user_email,
        first_name,
        last_name,
        preferred_locale,
        email_preferences
      `)
      .not('email_preferences->weekly_prompts', 'is', false);

    if (usersError) {
      console.error('[Weekly Prompts] Failed to fetch users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Filter users with email addresses and weekly prompts not explicitly disabled
    const eligibleUsers = (users || []).filter((user: UserWithPromptPrefs) => {
      const prefs = user.email_preferences;
      // Default to true if not explicitly set to false
      return user.email && (prefs === null || prefs.weekly_prompts !== false);
    });

    stats.users_eligible = eligibleUsers.length;

    if (eligibleUsers.length === 0) {
      console.log('[Weekly Prompts] No eligible users found');
      return NextResponse.json({
        success: true,
        stats,
        message: 'No eligible users',
      });
    }

    // Get auth user emails (user_profiles doesn't have email directly)
    const { data: authData } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(
      authData?.users.map((u) => [u.id, u.email]) || []
    );

    // Initialize Resend if available
    let resend: Resend | null = null;
    if (resendApiKey) {
      resend = new Resend(resendApiKey);
    }

    // Process each user
    for (const user of eligibleUsers) {
      const email = emailMap.get(user.id);
      if (!email) continue;

      try {
        // Get personalized prompt for this user
        const { data: promptResult, error: promptError } = await supabase.rpc(
          'get_weekly_prompt',
          { p_user_id: user.id }
        );

        if (promptError || !promptResult || promptResult.length === 0) {
          console.warn(`[Weekly Prompts] No prompt for user ${user.id}:`, promptError);
          continue;
        }

        const prompt = promptResult[0];
        const locale = (user.preferred_locale === 'ru' ? 'ru' : 'en') as 'en' | 'ru';

        const payload: StoryPromptEmailPayload = {
          recipientName: user.first_name || '',
          recipientEmail: email,
          promptId: prompt.prompt_id,
          promptText: prompt.prompt_text,
          promptTextRu: prompt.prompt_text_ru,
          category: prompt.category,
          locale,
          appUrl,
          unsubscribeUrl: `${appUrl}/settings/notifications?unsubscribe=weekly_prompts`,
        };

        // Send email via Resend
        if (resend) {
          const { error: emailError } = await resend.emails.send({
            from: `GeneTree <${fromEmail}>`,
            to: email,
            subject: buildPromptSubject(payload),
            text: buildPromptText(payload),
            html: buildPromptHtml(payload),
            replyTo: `stories@gene-tree.com`, // Inbound email address
          });

          if (emailError) {
            console.error(`[Weekly Prompts] Failed to send to ${email}:`, emailError);
            stats.errors.push(`${email}: ${emailError.message}`);
          } else {
            stats.emails_sent++;
            console.log(`[Weekly Prompts] Sent prompt to ${email}`);
          }
        } else {
          // Development: just log
          console.log(`[Weekly Prompts] Would send prompt to ${email}:`, prompt.prompt_text);
          stats.emails_sent++;
        }

      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : String(userError);
        console.error(`[Weekly Prompts] Error processing user ${user.id}:`, errorMsg);
        stats.errors.push(`${user.id}: ${errorMsg}`);
      }
    }

    console.log('[Weekly Prompts] Completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Weekly Prompts] Unexpected error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
