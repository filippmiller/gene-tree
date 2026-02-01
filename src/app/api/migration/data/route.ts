/**
 * API: /api/migration/data
 *
 * Returns migration data for the family tree visualization.
 * Extracts location data from profiles and builds migration paths.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { extractMigrationData } from '@/lib/migration/data-extractor';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: filter by specific profile ID
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id') || user.id;

    // Extract migration data
    const migrationData = await extractMigrationData(supabase, profileId);

    return NextResponse.json(migrationData);
  } catch (error) {
    console.error('[MIGRATION-DATA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch migration data' },
      { status: 500 }
    );
  }
}
