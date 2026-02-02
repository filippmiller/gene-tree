import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

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
}

/**
 * POST /api/onboarding/step3
 * Save siblings and spouse data from onboarding wizard step 3
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

    const body: SiblingsPayload = await request.json();
    const createdIds: string[] = [];

    // Create siblings
    for (const sibling of body.siblings) {
      if (!sibling.firstName) continue;

      let birthDate = null;
      if (sibling.birthYear) {
        birthDate = `${sibling.birthYear}-01-01`;
      }

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
        console.error('Error creating sibling:', error);
        continue;
      }

      if (data?.id) {
        createdIds.push(data.id);
      }
    }

    // Create spouse if provided
    if (body.spouse && body.spouse.firstName) {
      let birthDate = null;
      if (body.spouse.birthYear) {
        birthDate = `${body.spouse.birthYear}-01-01`;
      }

      let marriageDate = null;
      if (body.spouse.marriageYear) {
        marriageDate = `${body.spouse.marriageYear}-01-01`;
      }

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
        console.error('Error creating spouse:', error);
      } else if (data?.id) {
        createdIds.push(data.id);
      }
    }

    // Update onboarding step (column from migration 20260202300000)
    await admin
      .from('user_profiles')
      .update({ onboarding_step: 3 } as any)
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      createdIds,
    });
  } catch (error) {
    console.error('Step 3 error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
