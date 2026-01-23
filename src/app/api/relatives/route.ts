import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import { createNotification } from '@/lib/notifications';
import { sendSmsInvite } from '@/lib/invitations/sms';
import { sendEmailInvite } from '@/lib/invitations/email';

const PHONE_SANITIZE_RE = /[^\d+]/g;
const INVITES_MAX_PER_DAY = Number.parseInt(process.env.INVITES_MAX_PER_DAY || '25', 10);
const INVITES_LOOKBACK_MS = 24 * 60 * 60 * 1000;

function normalizePhone(value: string): string {
  return value.replace(PHONE_SANITIZE_RE, '');
}

function getInviteLocale(value: unknown): string {
  if (typeof value !== 'string') {
    return 'ru';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return 'ru';
  }
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(trimmed)) {
    return trimmed;
  }
  return 'ru';
}

function buildInviteUrl(request: Request, locale: string, token: string): string {
  const origin = new URL(request.url).origin;
  return `${origin}/${locale}/invite/${token}`;
}

export async function POST(request: Request) {
  const requestMeta = extractRequestMeta(request);
  const body = await request.json();
  
  try {
    // Use SSR client for auth (reads session from cookies)
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      await logAudit({
        action: 'create_relative_failed',
        method: 'POST',
        path: '/api/relatives',
        requestBody: body,
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const {
      isDirect,
      relatedToUserId,
      relatedToRelationship,
      firstName,
      lastName,
      email,
      phone,
      smsConsent,
      locale,
      relationshipType,
      facebookUrl,
      instagramUrl,
      qualifiers, // halfness, lineage, cousin_degree, cousin_removed, level
      isDeceased,
      dateOfBirth,
    } = body;
    
    // Validation
    if (!firstName || !lastName || !relationshipType) {
      return NextResponse.json(
        { error: 'First name, last name, and relationship type are required' },
        { status: 400 }
      );
    }
    
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    const normalizedPhone = typeof phone === 'string' && phone ? normalizePhone(phone) : '';
    const hasEmail = Boolean(normalizedEmail);
    const hasSmsConsent = Boolean(smsConsent);
    const canSendSms = Boolean(normalizedPhone) && hasSmsConsent && !isDeceased;
    const canSendEmail = hasEmail && !isDeceased;
    
    // Contact required only if not deceased
    if (!isDeceased && !hasEmail && !normalizedPhone) {
      return NextResponse.json(
        { error: 'At least one contact method (email or phone) is required' },
        { status: 400 }
      );
    }
    
    if (!isDeceased && normalizedPhone && !hasSmsConsent && !hasEmail) {
      return NextResponse.json(
        { error: 'SMS consent is required when phone is the only contact method' },
        { status: 400 }
      );
    }
    
    // For indirect relationships, validate related_to fields
    if (!isDirect && (!relatedToUserId || !relatedToRelationship)) {
      return NextResponse.json(
        { error: 'For indirect relationships, related person and relationship are required' },
        { status: 400 }
      );
    }

    // DUPLICATE DETECTION: Check if this person already exists
    // Search by email (if provided) or by name + connection to current user's network
    let duplicateCheck = null;
    
    if (normalizedEmail) {
      // Check if email already exists in pending_relatives or user_profiles
      const { data: existingByEmail } = await getSupabaseAdmin()
        .from('pending_relatives')
        .select('id, first_name, last_name, email, invited_by')
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .limit(1)
        .single();
      
      if (existingByEmail) {
        duplicateCheck = existingByEmail;
      }
    }

    if (!duplicateCheck && normalizedPhone) {
      const { data: existingByPhone } = await getSupabaseAdmin()
        .from('pending_relatives')
        .select('id, first_name, last_name, phone, invited_by')
        .eq('phone', normalizedPhone)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (existingByPhone) {
        duplicateCheck = existingByPhone;
      }
    }

    // If duplicate found, return info instead of creating new invitation
    if (duplicateCheck) {
      await logAudit({
        action: 'create_relative_duplicate_found',
        entityType: 'pending_relatives',
        entityId: duplicateCheck.id,
        method: 'POST',
        path: '/api/relatives',
        requestBody: body,
        responseStatus: 409,
        responseBody: { duplicate: duplicateCheck },
        ...requestMeta,
      });
      
      return NextResponse.json(
        { 
          error: 'Duplicate found',
          duplicate: duplicateCheck,
          message: `${duplicateCheck.first_name} ${duplicateCheck.last_name} уже приглашён. Хотите подтвердить связь?`
        },
        { status: 409 }
      );
    }
    
    const shouldInvite = !isDeceased && (canSendSms || canSendEmail);
    if (shouldInvite && INVITES_MAX_PER_DAY > 0) {
      const since = new Date(Date.now() - INVITES_LOOKBACK_MS).toISOString();
      const { count, error: countError } = await getSupabaseAdmin()
        .from('pending_relatives')
        .select('id', { count: 'exact', head: true })
        .eq('invited_by', user.id)
        .gte('created_at', since)
        .not('invitation_token', 'is', null);

      if (countError) {
        await logAudit({
          action: 'invite_rate_limit_check_failed',
          entityType: 'pending_relatives',
          method: 'POST',
          path: '/api/relatives',
          requestBody: body,
          responseStatus: 500,
          errorMessage: countError.message,
          errorStack: JSON.stringify(countError),
          ...requestMeta,
        });
        return NextResponse.json(
          { error: 'Unable to validate invite limits. Please try again.' },
          { status: 500 }
        );
      }

      if ((count || 0) >= INVITES_MAX_PER_DAY) {
        await logAudit({
          action: 'invite_rate_limited',
          entityType: 'pending_relatives',
          method: 'POST',
          path: '/api/relatives',
          requestBody: body,
          responseStatus: 429,
          responseBody: { count, max: INVITES_MAX_PER_DAY },
          ...requestMeta,
        });
        return NextResponse.json(
          { error: 'Invite limit reached. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Insert into pending_relatives table
    const { data, error } = await getSupabaseAdmin()
      .from('pending_relatives')
      .insert({
        invited_by: user.id,
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        relationship_type: relationshipType,
        related_to_user_id: isDirect ? null : relatedToUserId,
        related_to_relationship: isDirect ? null : relatedToRelationship,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        status: shouldInvite ? 'pending' : 'verified',
        invitation_token: shouldInvite ? crypto.randomUUID() : undefined,
        // Qualifiers
        halfness: qualifiers?.halfness || null,
        lineage: qualifiers?.lineage || null,
        cousin_degree: qualifiers?.cousin_degree || null,
        cousin_removed: qualifiers?.cousin_removed || null,
        level: qualifiers?.level || null,
        // Deceased & date of birth
        is_deceased: isDeceased || false,
        date_of_birth: dateOfBirth || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pending relative:', error);
      await logAudit({
        action: 'create_relative_failed',
        entityType: 'pending_relatives',
        method: 'POST',
        path: '/api/relatives',
        requestBody: body,
        responseStatus: 500,
        errorMessage: error.message,
        errorStack: JSON.stringify(error),
        ...requestMeta,
      });
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }
    
    // Log successful creation
    await logAudit({
      action: 'create_relative_success',
      entityType: 'pending_relatives',
      entityId: data.id,
      method: 'POST',
      path: '/api/relatives',
      requestBody: body,
      responseStatus: 200,
      responseBody: { id: data.id, firstName: data.first_name, lastName: data.last_name },
      ...requestMeta,
    });
    
    // Create notification for family circle
    await createNotification({
      eventType: 'relative_added',
      actorUserId: user.id,
      primaryProfileId: user.id,
      relatedProfileId: null,
      payload: {
        first_name: data.first_name,
        last_name: data.last_name,
        relationship_type: relationshipType,
      },
    });
    
    if (shouldInvite && data.invitation_token) {
      const inviteUrl = buildInviteUrl(request, getInviteLocale(locale), data.invitation_token);
      const { data: inviterProfile } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      const inviterName = inviterProfile
        ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
        : user.user_metadata?.name || user.email || 'A family member';
      const inviteeName = `${data.first_name} ${data.last_name}`.trim();
      let invitationSent = false;

      if (canSendSms) {
        const smsResult = await sendSmsInvite({
          to: normalizedPhone,
          inviterName,
          inviteeName,
          inviteUrl,
        });

        if (smsResult.ok) {
          invitationSent = true;
          await logAudit({
            action: 'invitation_sms_sent',
            entityType: 'pending_relatives',
            entityId: data.id,
            method: 'POST',
            path: '/api/relatives',
            requestBody: { phone: normalizedPhone },
            responseStatus: 200,
            responseBody: { sid: smsResult.sid },
            ...requestMeta,
          });
        } else {
          await logAudit({
            action: 'invitation_sms_failed',
            entityType: 'pending_relatives',
            entityId: data.id,
            method: 'POST',
            path: '/api/relatives',
            requestBody: { phone: normalizedPhone },
            responseStatus: 502,
            errorMessage: smsResult.error || 'sms_send_failed',
            responseBody: { skipped: smsResult.skipped || false },
            ...requestMeta,
          });
        }
      }

      if (canSendEmail && (!canSendSms || !invitationSent)) {
        const emailResult = await sendEmailInvite({
          to: normalizedEmail,
          inviterName,
          inviteeName,
          inviteUrl,
        });

        if (emailResult.ok) {
          invitationSent = true;
          await logAudit({
            action: 'invitation_email_sent',
            entityType: 'pending_relatives',
            entityId: data.id,
            method: 'POST',
            path: '/api/relatives',
            requestBody: { email: normalizedEmail },
            responseStatus: 200,
            responseBody: { id: emailResult.id },
            ...requestMeta,
          });
        } else {
          await logAudit({
            action: 'invitation_email_failed',
            entityType: 'pending_relatives',
            entityId: data.id,
            method: 'POST',
            path: '/api/relatives',
            requestBody: { email: normalizedEmail },
            responseStatus: 502,
            errorMessage: emailResult.error || 'email_send_failed',
            responseBody: { skipped: emailResult.skipped || false },
            ...requestMeta,
          });
        }
      }

      if (invitationSent) {
        await getSupabaseAdmin()
          .from('pending_relatives')
          .update({ invited_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/relatives:', error);
    await logAudit({
      action: 'create_relative_exception',
      method: 'POST',
      path: '/api/relatives',
      requestBody: body,
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

export async function GET() {
  try {
    // Use SSR client for auth (reads session from cookies)
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch pending relatives invited by current user
    const { data, error } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select('*')
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending relatives:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending relatives' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/relatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

