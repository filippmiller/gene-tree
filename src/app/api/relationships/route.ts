import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/relationships - Get all relationships for the authenticated user
export async function GET(request: NextRequest) {
  console.log('[RELATIONSHIPS-API] GET request received');
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[RELATIONSHIPS-API] Fetching pending relatives for user:', user.id);

    // Get pending relatives added by this user (these are the "relationships")
    const { data: pendingRelatives, error } = await supabase
      .from('pending_relatives')
      .select('id, first_name, last_name, email, relationship_type, verification_status, is_deceased, date_of_birth, invited_by, status')
      .eq('invited_by', user.id);

    if (error) {
      console.error('[RELATIONSHIPS-API] Error fetching pending relatives:', error);
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

    console.log('[RELATIONSHIPS-API] Found pending relatives as relationships:', relationships?.length || 0);

    return NextResponse.json({ relationships: relationships || [] });
  } catch (error: any) {
    console.error('[RELATIONSHIPS-API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/relationships - Create a new relationship
export async function POST(request: NextRequest) {
  console.log('[RELATIONSHIPS-API] POST request received');
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
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

    console.log('[RELATIONSHIPS-API] Creating relationship:', {
      user1_id: user.id,
      user2_id,
      relationship_type
    });

    const relationshipData: any = {
      user1_id: user.id,
      user2_id,
      relationship_type,
    };

    if (marriage_date) relationshipData.marriage_date = marriage_date;
    if (marriage_place) relationshipData.marriage_place = marriage_place;
    if (divorce_date) relationshipData.divorce_date = divorce_date;

    const { data: relationship, error } = await supabase
      .from('relationships')
      .insert(relationshipData)
      .select()
      .single();

    if (error) {
      console.error('[RELATIONSHIPS-API] Error creating relationship:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[RELATIONSHIPS-API] Relationship created successfully:', relationship.id);

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error: any) {
    console.error('[RELATIONSHIPS-API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
