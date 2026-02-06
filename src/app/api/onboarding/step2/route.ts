import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { apiLogger } from '@/lib/logger';

interface ParentData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  isDeceased: boolean;
  skip?: boolean;
}

interface ParentsPayload {
  mother: ParentData;
  father: ParentData;
  /** IDs from a previous submission of this step, to be replaced */
  previousIds?: string[];
}

/**
 * POST /api/onboarding/step2
 * Save parents data from onboarding wizard step 2
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const admin = getSupabaseAdmin();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ParentsPayload = await request.json();
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

    // Helper to create parent
    const createParent = async (
      parent: ParentData,
      gender: 'male' | 'female'
    ): Promise<string | null> => {
      if (parent.skip || !parent.firstName?.trim()) {
        return null;
      }

      // Validate and calculate approximate birth date from year
      const birthDate = validateBirthYear(parent.birthYear);

      // Create pending_relative record
      const { data, error } = await admin
        .from('pending_relatives')
        .insert({
          invited_by: user.id,
          first_name: parent.firstName,
          last_name: parent.lastName || '',
          relationship_type: 'parent',
          gender,
          is_deceased: parent.isDeceased,
          birth_date: birthDate,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        apiLogger.error({ error: error.message, userId: user.id, gender }, 'Error creating parent in onboarding step 2');
        return null;
      }

      return data?.id || null;
    };

    // Create mother
    const motherId = await createParent(body.mother, 'female');
    if (motherId) {
      createdIds.push(motherId);
    }

    // Create father
    const fatherId = await createParent(body.father, 'male');
    if (fatherId) {
      createdIds.push(fatherId);
    }

    // Update onboarding step (column from migration 20260202300000)
    await admin
      .from('user_profiles')
      .update({ onboarding_step: 2 } as any)
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      createdIds,
    });
  } catch (error) {
    apiLogger.error({ error: error instanceof Error ? error.message : 'unknown' }, 'Onboarding step 2 error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
