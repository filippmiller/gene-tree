/**
 * Unsubscribe from Weekly Digest
 *
 * Handles one-click unsubscribe from digest emails.
 * Uses a simple token verification to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { EmailPreferences } from '@/types/email-preferences';
import { DEFAULT_EMAIL_PREFERENCES } from '@/types/email-preferences';

/**
 * Verify unsubscribe token
 */
function verifyUnsubscribeToken(userId: string, token: string): boolean {
  // Simple hash verification - matches generation in weekly-digest route
  const data = `${userId}:${process.env.CRON_SECRET || 'digest'}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const expectedToken = Math.abs(hash).toString(36);
  return token === expectedToken;
}

/**
 * GET /api/digest/unsubscribe
 * One-click unsubscribe from weekly digest
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user');
  const token = searchParams.get('token');

  if (!userId || !token) {
    return new NextResponse(renderPage('error', 'Invalid unsubscribe link'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Verify token
  if (!verifyUnsubscribeToken(userId, token)) {
    return new NextResponse(renderPage('error', 'Invalid or expired unsubscribe link'), {
      status: 403,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    const admin = getSupabaseAdmin();

    // Get current preferences
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: profile, error: fetchError } = await (admin as any)
      .from('user_profiles')
      .select('email_preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[Unsubscribe] Error fetching profile:', fetchError);
      return new NextResponse(renderPage('error', 'User not found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Merge with defaults and disable weekly digest
    const currentPrefs: EmailPreferences = {
      ...DEFAULT_EMAIL_PREFERENCES,
      ...((profile as any)?.email_preferences as Partial<EmailPreferences> || {})
    };

    const updatedPrefs: EmailPreferences = {
      ...currentPrefs,
      weekly_digest: false
    };

    // Update preferences
    // Note: Using 'as any' until migration runs and types are regenerated
    const { error: updateError } = await (admin as any)
      .from('user_profiles')
      .update({ email_preferences: updatedPrefs })
      .eq('id', userId);

    if (updateError) {
      console.error('[Unsubscribe] Error updating preferences:', updateError);
      return new NextResponse(renderPage('error', 'Failed to unsubscribe. Please try again.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    console.log(`[Unsubscribe] User ${userId} unsubscribed from weekly digest`);

    return new NextResponse(renderPage('success', 'You have been unsubscribed'), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return new NextResponse(renderPage('error', 'An error occurred'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Render simple HTML page for unsubscribe result
 */
function renderPage(status: 'success' | 'error', message: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.app';

  const icon = status === 'success' ? '&#10003;' : '&#10007;';
  const iconColor = status === 'success' ? '#10b981' : '#ef4444';
  const title = status === 'success' ? 'Unsubscribed' : 'Error';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Gene-Tree</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${iconColor}15;
      color: ${iconColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 24px;
    }
    h1 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
    .button:hover {
      background: #1d4ed8;
    }
    .secondary {
      display: block;
      margin-top: 16px;
      color: #6b7280;
      font-size: 14px;
    }
    .secondary a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${status === 'success' ? `
      <p style="font-size: 14px;">
        You will no longer receive weekly family digest emails.
        You can re-enable this in your profile settings.
      </p>
      <a href="${baseUrl}/app" class="button">Go to Dashboard</a>
      <span class="secondary">
        <a href="${baseUrl}/family-profile/settings">Manage email preferences</a>
      </span>
    ` : `
      <a href="${baseUrl}/app" class="button">Go to Dashboard</a>
    `}
  </div>
</body>
</html>
`.trim();
}
