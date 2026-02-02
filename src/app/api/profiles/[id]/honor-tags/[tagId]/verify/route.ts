import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface RouteParams {
  params: Promise<{ id: string; tagId: string }>;
}

/**
 * POST /api/profiles/:id/honor-tags/:tagId/verify
 *
 * Submit a verification for an honor tag (family members can verify)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId, tagId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { verified, comment } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'verified field is required' },
        { status: 400 }
      );
    }

    // Can't verify own profile's tags
    if (profileId === user.id) {
      return NextResponse.json(
        { error: 'Cannot verify your own honor tags' },
        { status: 403 }
      );
    }

    // Check if the profile honor tag exists
    // Tables not yet in generated types, using 'as any'
    const { data: profileTag, error: tagError } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .select('id, profile_id, verification_level')
      .eq('id', tagId)
      .eq('profile_id', profileId)
      .single();

    if (tagError || !profileTag) {
      return NextResponse.json(
        { error: 'Honor tag not found on this profile' },
        { status: 404 }
      );
    }

    // Already documented - no more verifications needed
    if (profileTag.verification_level === 'documented') {
      return NextResponse.json(
        { error: 'This honor tag is already fully verified' },
        { status: 400 }
      );
    }

    // Check if user already verified this tag
    const { data: existingVerification } = await (supabaseAdmin as any)
      .from('honor_tag_verifications')
      .select('id')
      .eq('profile_honor_tag_id', tagId)
      .eq('verifier_id', user.id)
      .maybeSingle();

    if (existingVerification) {
      return NextResponse.json(
        { error: 'You have already verified this honor tag' },
        { status: 409 }
      );
    }

    // Add the verification
    const { data: verification, error: insertError } = await (supabaseAdmin as any)
      .from('honor_tag_verifications')
      .insert({
        profile_honor_tag_id: tagId,
        verifier_id: user.id,
        verified,
        comment,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding verification:', insertError);
      return NextResponse.json(
        { error: 'Failed to add verification' },
        { status: 500 }
      );
    }

    // Check if we should upgrade the verification level (3+ positive verifications)
    const { count: positiveCount } = await (supabaseAdmin as any)
      .from('honor_tag_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_honor_tag_id', tagId)
      .eq('verified', true);

    let newVerificationLevel = profileTag.verification_level;

    if ((positiveCount || 0) >= 3 && profileTag.verification_level === 'self_declared') {
      // Upgrade to family_verified
      const { data: verifiers } = await (supabaseAdmin as any)
        .from('honor_tag_verifications')
        .select('verifier_id')
        .eq('profile_honor_tag_id', tagId)
        .eq('verified', true);

      const verifierIds = verifiers?.map((v: any) => v.verifier_id) || [];

      await (supabaseAdmin as any)
        .from('profile_honor_tags')
        .update({
          verification_level: 'family_verified',
          verified_by: verifierIds,
        })
        .eq('id', tagId);

      newVerificationLevel = 'family_verified';
    }

    return NextResponse.json({
      verification,
      verification_level: newVerificationLevel,
      positive_verifications: positiveCount || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/profiles/:id/honor-tags/:tagId/verify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profiles/:id/honor-tags/:tagId/verify
 *
 * Get verification status for an honor tag
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { tagId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get verifications
    // Tables not yet in generated types, using 'as any'
    const { data: verifications, error } = await (supabaseAdmin as any)
      .from('honor_tag_verifications')
      .select(`
        id,
        verifier_id,
        verified,
        comment,
        created_at
      `)
      .eq('profile_honor_tag_id', tagId);

    if (error) {
      console.error('Error fetching verifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 500 }
      );
    }

    const positiveCount = verifications?.filter((v: any) => v.verified).length || 0;
    const negativeCount = verifications?.filter((v: any) => !v.verified).length || 0;
    const userHasVerified = user
      ? verifications?.some((v: any) => v.verifier_id === user.id)
      : false;

    return NextResponse.json({
      verifications,
      positive_count: positiveCount,
      negative_count: negativeCount,
      user_has_verified: userHasVerified,
      required_for_upgrade: 3,
    });
  } catch (error) {
    console.error('Error in GET /api/profiles/:id/honor-tags/:tagId/verify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
