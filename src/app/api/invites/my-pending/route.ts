import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending relatives where email matches current user's email
    // We use admin client to bypass RLS if necessary, though RLS should allow reading own invites
    // Using admin ensures we find them even if RLS is strict about "users can only see their own profile"
    const { data, error } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select(`
        id,
        first_name,
        last_name,
        relationship_type,
        invited_by,
        invitation_token,
        created_at,
        role_for_a,
        role_for_b
      `)
      .eq('email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    // Enhance data with inviter details
    const enhancedData = await Promise.all(data.map(async (invite) => {
      const { data: inviterProfile } = await getSupabaseAdmin()
        .from('user_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', invite.invited_by)
        .single();

      return {
        ...invite,
        inviter: inviterProfile || { first_name: 'Unknown', last_name: 'User' }
      };
    }));

    return NextResponse.json(enhancedData);
  } catch (error) {
    console.error('Error in GET /api/invites/my-pending:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
