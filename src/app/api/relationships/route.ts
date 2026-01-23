import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/relationships - Get all relationships for the authenticated user
export async function GET() {
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending relatives added by this user (these are the "relationships")
    const { data: pendingRelatives, error } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select('id, first_name, last_name, email, relationship_type, verification_status, is_deceased, date_of_birth, invited_by, status')
      .eq('invited_by', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to relationships format
    const relationships = (pendingRelatives || []).map(rel => ({
      id: rel.id,
      user1_id: user.id, // current user
      user2_id: rel.id, // the relative
      relationship_type: rel.relationship_type || 'unknown',
      verification_status: rel.verification_status || 'pending',
      status: rel.status,
      is_deceased: rel.is_deceased,
      date_of_birth: rel.date_of_birth,
      created_at: new Date().toISOString(),
      marriage_date: null,
      marriage_place: null,
      divorce_date: null,
      // Attach person data directly
      user1: null, // current user (not needed)
      user2: {
        id: rel.id,
        first_name: rel.first_name,
        last_name: rel.last_name,
        email: rel.email,
        avatar_url: null
      }
    }));

    return NextResponse.json({ relationships: relationships || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/relationships - Create a new relationship
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user2_id, relationship_type, marriage_date, marriage_place, divorce_date } = body;

    if (!user2_id || !relationship_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user2_id, relationship_type' },
        { status: 400 }
      );
    }

    const relationshipData: any = {
      user1_id: user.id,
      user2_id,
      relationship_type,
    };

    if (marriage_date) relationshipData.marriage_date = marriage_date;
    if (marriage_place) relationshipData.marriage_place = marriage_place;
    if (divorce_date) relationshipData.divorce_date = divorce_date;

    const { data: relationship, error } = await getSupabaseAdmin()
      .from('relationships')
      .insert(relationshipData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

