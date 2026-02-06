import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { apiLogger } from '@/lib/logger';

interface SiblingData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  gender: 'male' | 'female';
}

interface SpouseData {
  firstName: string;
  lastName: string;
  birthYear?: string;
  marriageYear?: string;
}

interface SiblingsPayload {
  siblings: SiblingData[];
  spouse?: SpouseData;
  /** IDs from a previous submission of this step, to be replaced */
  previousIds?: string[];
}

/**
 * POST /api/onboarding/step3
 * Save siblings and spouse data from onboarding wizard step 3
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

    const body: SiblingsPayload = await request.json();
    const createdIds: string[] = [];

    // Delete previous records from this step to prevent duplicates on re-submission
    if (body.previousIds && body.previousIds.length > 0) {
      await admin
        .from('pending_relatives')
        .delete()
        .in('id', body.previousIds)
        .eq('invited_by', user.id);
    }

    // Validate birth year ranges
    const currentYear = new Date().getFullYear();
    const validateYear = (year?: string): string | null => {
      if (!year) return null;
      const num = parseInt(year, 10);
      if (isNaN(num) || num < 1850 || num > currentYear) return null;
      return `${num}-01-01`;
    };

    // Create siblings
    for (const sibling of body.siblings) {
      if (!sibling.firstName?.trim()) continue;

      const birthDate = validateYear(sibling.birthYear);

      const { data, error } = await admin
        .from('pending_relatives')
        .insert({
          invited_by: user.id,
          first_name: sibling.firstName,
          last_name: sibling.lastName || '',
          relationship_type: 'sibling',
          gender: sibling.gender,
          birth_date: birthDate,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        apiLogger.error({ error: error.message, userId: user.id, siblingName: sibling.firstName }, 'Error creating sibling in onboarding step 3');
        continue;
      }

      if (data?.id) {
        createdIds.push(data.id);
      }
    }

    // Create spouse if provided
    if (body.spouse && body.spouse.firstName?.trim()) {
      const birthDate = validateYear(body.spouse.birthYear);
      const marriageDate = validateYear(body.spouse.marriageYear);

      const { data, error } = await admin
        .from('pending_relatives')
        .insert({
          invited_by: user.id,
          first_name: body.spouse.firstName,
          last_name: body.spouse.lastName || '',
          relationship_type: 'spouse',
          birth_date: birthDate,
          marriage_date: marriageDate,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        apiLogger.error({ error: error.message, userId: user.id }, 'Error creating spouse in onboarding step 3');
      } else if (data?.id) {
        createdIds.push(data.id);
      }
    }

    // Update onboarding step (column from migration 20260202300000)
    await admin
      .from('user_profiles')
      .update({ onboarding_step: 4 } as any)
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      createdIds,
    });
  } catch (error) {
    apiLogger.error({ error: error instanceof Error ? error.message : 'unknown' }, 'Onboarding step 3 error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
