/**
 * POST /api/relatives/connect
 *
 * Send a connection request to a potential relative.
 *
 * Body:
 * - toUserId: UUID of the user to connect with
 * - sharedAncestorId: UUID of the shared ancestor
 * - message?: Optional personal message
 * - relationshipDescription?: Description of the relationship
 *
 * GET /api/relatives/connect
 *
 * Get connection requests for the current user.
 *
 * Query params:
 * - status: pending | accepted | declined | cancelled | all (default: all)
 * - direction: sent | received | all (default: all)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import {
  createConnectionRequest,
  getConnectionRequests,
  hasExistingRequest,
  getMatchingPreferences,
} from '@/lib/relatives';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  const requestMeta = extractRequestMeta(request);

  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, sharedAncestorId, message, relationshipDescription } = body;

    // Validation
    if (!toUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (!sharedAncestorId) {
      return NextResponse.json(
        { error: 'Shared ancestor ID is required' },
        { status: 400 }
      );
    }

    if (toUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot send connection request to yourself' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if target user allows matching
    const targetPreferences = await getMatchingPreferences(supabaseAdmin, toUserId);
    if (targetPreferences && !targetPreferences.allow_matching) {
      return NextResponse.json(
        { error: 'This user has disabled relative matching' },
        { status: 403 }
      );
    }

    // Check for existing request
    const existingRequest = await hasExistingRequest(supabaseAdmin, user.id, toUserId);
    if (existingRequest) {
      return NextResponse.json(
        { error: 'A connection request already exists with this user' },
        { status: 409 }
      );
    }

    // Create the connection request
    const connectionRequest = await createConnectionRequest(
      supabaseAdmin,
      user.id,
      toUserId,
      sharedAncestorId,
      message,
      relationshipDescription
    );

    if (!connectionRequest) {
      return NextResponse.json(
        { error: 'Failed to create connection request' },
        { status: 500 }
      );
    }

    // Log success
    await logAudit({
      action: 'connection_request_created',
      entityType: 'connection_requests',
      entityId: connectionRequest.id,
      method: 'POST',
      path: '/api/relatives/connect',
      requestBody: { toUserId, sharedAncestorId },
      responseStatus: 201,
      ...requestMeta,
    });

    return NextResponse.json(connectionRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/relatives/connect:', error);

    await logAudit({
      action: 'connection_request_error',
      method: 'POST',
      path: '/api/relatives/connect',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestMeta = extractRequestMeta(request);

  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'pending' | 'accepted' | 'declined' | 'cancelled' | 'all' || 'all';
    const direction = searchParams.get('direction') as 'sent' | 'received' | 'all' || 'all';

    const supabaseAdmin = getSupabaseAdmin();
    const requests = await getConnectionRequests(supabaseAdmin, user.id, {
      status,
      direction,
    });

    return NextResponse.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error('Error in GET /api/relatives/connect:', error);

    await logAudit({
      action: 'get_connection_requests_error',
      method: 'GET',
      path: '/api/relatives/connect',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to fetch connection requests' },
      { status: 500 }
    );
  }
}
