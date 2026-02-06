import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { apiLogger } from '@/lib/logger';

interface GrandparentData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  isDeceased: boolean;
  skip?: boolean;
}

interface GrandparentsPayload {
  maternalGrandmother: GrandparentData;
  maternalGrandfather: GrandparentData;
  paternalGrandmother: GrandparentData;
  paternalGrandfather: GrandparentData;
  /** Parent IDs from step 2, used to set related_to_user_id */
  motherParentId?: string;
  fatherParentId?: string;
  /** IDs from a previous submission of this step, to be replaced */
  previousIds?: string[];
}

/**
 * POST /api/onboarding/step3-grandparents
 * Save grandparents data from onboarding wizard step 3
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const admin = getSupabaseAdmin();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GrandparentsPayload = await request.json();
    const createdIds: string[] = [];

    // Delete previous records from this step to prevent duplicates on re-submission
    if (body.previousIds && body.previousIds.length > 0) {
      await admin
        .from('pending_relatives')
        .delete()
        .in('id', body.previousIds)
        .eq('invited_by', user.id);
    }

    // Validate birth year range
    const currentYear = new Date().getFullYear();
    const validateBirthYear = (year?: string): string | null => {
      if (!year) return null;
      const num = parseInt(year, 10);
      if (isNaN(num) || num < 1850 || num > currentYear) return null;
      return `${num}-01-01`;
    };

    // Helper to create grandparent
    const createGrandparent = async (
      grandparent: GrandparentData,
      gender: 'male' | 'female',
      lineage: 'maternal' | 'paternal'
    ): Promise<string | null> => {
      if (grandparent.skip || !grandparent.firstName?.trim()) {
        return null;
      }

      const birthDate = validateBirthYear(grandparent.birthYear);

      const { data, error } = await admin
        .from('pending_relatives')
        .insert({
          invited_by: user.id,
          first_name: grandparent.firstName,
          last_name: grandparent.lastName || '',
          relationship_type: 'grandparent',
          gender,
          lineage,
          is_deceased: grandparent.isDeceased,
          birth_date: birthDate,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        apiLogger.error(
          { error: error.message, userId: user.id, gender, lineage },
          'Error creating grandparent in onboarding step 3'
        );
        return null;
      }

      return data?.id || null;
    };

    // Create maternal grandparents
    const mgmId = await createGrandparent(body.maternalGrandmother, 'female', 'maternal');
    if (mgmId) createdIds.push(mgmId);

    const mgfId = await createGrandparent(body.maternalGrandfather, 'male', 'maternal');
    if (mgfId) createdIds.push(mgfId);

    // Create paternal grandparents
    const pgmId = await createGrandparent(body.paternalGrandmother, 'female', 'paternal');
    if (pgmId) createdIds.push(pgmId);

    const pgfId = await createGrandparent(body.paternalGrandfather, 'male', 'paternal');
    if (pgfId) createdIds.push(pgfId);

    // Update onboarding step
    await admin
      .from('user_profiles')
      .update({ onboarding_step: 3 } as any)
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      createdIds,
    });
  } catch (error) {
    apiLogger.error(
      { error: error instanceof Error ? error.message : 'unknown' },
      'Onboarding step 3 grandparents error'
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
