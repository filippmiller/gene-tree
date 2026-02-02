import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

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

    // Helper to create parent
    const createParent = async (
      parent: ParentData,
      gender: 'male' | 'female'
    ): Promise<string | null> => {
      if (parent.skip || !parent.firstName) {
        return null;
      }

      // Calculate approximate birth date from year
      let birthDate = null;
      if (parent.birthYear) {
        birthDate = `${parent.birthYear}-01-01`;
      }

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
        console.error('Error creating parent:', error);
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
    console.error('Step 2 error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
