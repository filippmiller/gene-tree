import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete for the current user
 */
export async function POST() {
  try {
    const supabase = await getSupabaseSSR();
    const admin = getSupabaseAdmin();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: updateError } = await admin
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 5,
      } as any)
      .eq('id', user.id);

    if (updateError) {
      apiLogger.error({ error: updateError.message, userId: user.id }, 'Error completing onboarding');
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
    });
  } catch (error) {
    apiLogger.error({ error: error instanceof Error ? error.message : 'unknown' }, 'Complete onboarding error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
