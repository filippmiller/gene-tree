/**
 * Smart Invite Guard API Endpoint
 *
 * POST /api/invitations/check
 *
 * Pre-validates an email or phone before sending an invitation.
 * Detects duplicates, self-invites, and existing family members.
 */

import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import {
  checkInviteEligibility,
  type InviteCheckResult,
} from '@/lib/invitations/invite-guard';

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic check - must have some digits)
 */
function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export async function POST(request: Request) {
  const requestMeta = extractRequestMeta(request);
  let body: { email?: string; phone?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  try {
    // Authenticate user via SSR client
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      await logAudit({
        action: 'invite_check_unauthorized',
        method: 'POST',
        path: '/api/invitations/check',
        requestBody: { email: body.email ? '***' : undefined, phone: body.phone ? '***' : undefined },
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, phone } = body;

    // Validate that at least one contact method is provided
    if (!email && !phone) {
      await logAudit({
        action: 'invite_check_validation_failed',
        method: 'POST',
        path: '/api/invitations/check',
        requestBody: body,
        responseStatus: 400,
        errorMessage: 'Email or phone is required',
        ...requestMeta,
      });

      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      await logAudit({
        action: 'invite_check_validation_failed',
        method: 'POST',
        path: '/api/invitations/check',
        requestBody: { email: '***' },
        responseStatus: 400,
        errorMessage: 'Invalid email format',
        ...requestMeta,
      });

      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      await logAudit({
        action: 'invite_check_validation_failed',
        method: 'POST',
        path: '/api/invitations/check',
        requestBody: { phone: '***' },
        responseStatus: 400,
        errorMessage: 'Invalid phone format',
        ...requestMeta,
      });

      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      );
    }

    // Perform the invite eligibility check
    const result: InviteCheckResult = await checkInviteEligibility(
      email || null,
      phone || null,
      user.id
    );

    // Log the check with appropriate masking for PII
    await logAudit({
      action: 'invite_check_completed',
      method: 'POST',
      path: '/api/invitations/check',
      requestBody: {
        email: email ? '***@***' : undefined,
        phone: phone ? '***' : undefined,
      },
      responseStatus: 200,
      responseBody: {
        status: result.status,
        hasExistingMember: Boolean(result.existingMember),
        hasPendingInvite: Boolean(result.pendingInvite),
        hasBridgeCandidate: Boolean(result.bridgeCandidate),
      },
      ...requestMeta,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/invitations/check:', error);

    await logAudit({
      action: 'invite_check_exception',
      method: 'POST',
      path: '/api/invitations/check',
      requestBody: {
        email: body.email ? '***' : undefined,
        phone: body.phone ? '***' : undefined,
      },
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
