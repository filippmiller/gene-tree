/**
 * POST /api/duplicates/dismiss
 *
 * Marks a potential duplicate as "not a duplicate".
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { dismissDuplicate } from '@/lib/duplicates/merge-service';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  const authResult = await requireAdminContext();

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.reason === 'not_authenticated' ? 'Unauthorized' : 'Forbidden' },
      { status: authResult.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const { duplicateId } = body;

    // Validate request
    if (!duplicateId) {
      return NextResponse.json(
        { error: 'Missing required field: duplicateId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify the duplicate record exists and is pending
    const { data: duplicate, error: dupError } = await supabase
      .from('potential_duplicates')
      .select('*')
      .eq('id', duplicateId)
      .single();

    if (dupError || !duplicate) {
      return NextResponse.json(
        { error: 'Duplicate record not found' },
        { status: 404 }
      );
    }

    if (duplicate.status !== 'pending') {
      return NextResponse.json(
        { error: `Duplicate has already been ${duplicate.status}` },
        { status: 400 }
      );
    }

    // Dismiss the duplicate
    const result = await dismissDuplicate(supabase, duplicateId, authResult.user.id);

    // Log the dismiss action
    await logAudit({
      action: result.success ? 'duplicate_dismissed' : 'duplicate_dismiss_failed',
      entityType: 'potential_duplicates',
      entityId: duplicateId,
      method: 'POST',
      path: '/api/duplicates/dismiss',
      responseStatus: result.success ? 200 : 500,
      errorMessage: result.error,
      ...extractRequestMeta(request),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dismiss duplicate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Duplicate marked as not a duplicate',
    });
  } catch (error) {
    console.error('[DuplicateDismiss] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
