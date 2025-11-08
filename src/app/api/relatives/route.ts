import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      isDirect,
      relatedToUserId,
      relatedToRelationship,
      firstName,
      lastName,
      email,
      phone,
      relationshipType,
      gender,
      facebookUrl,
      instagramUrl,
      qualifiers, // halfness, lineage, cousin_degree, cousin_removed, level
    } = body;
    
    // Validation
    if (!firstName || !lastName || !relationshipType) {
      return NextResponse.json(
        { error: 'First name, last name, and relationship type are required' },
        { status: 400 }
      );
    }
    
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'At least one contact method (email or phone) is required' },
        { status: 400 }
      );
    }
    
    // For indirect relationships, validate related_to fields
    if (!isDirect && (!relatedToUserId || !relatedToRelationship)) {
      return NextResponse.json(
        { error: 'For indirect relationships, related person and relationship are required' },
        { status: 400 }
      );
    }
    
    // Insert into pending_relatives table
    const { data, error } = await supabase
      .from('pending_relatives')
      .insert({
        invited_by: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        relationship_type: relationshipType,
        related_to_user_id: isDirect ? null : relatedToUserId,
        related_to_relationship: isDirect ? null : relatedToRelationship,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        status: 'pending',
        // Qualifiers
        halfness: qualifiers?.halfness || null,
        lineage: qualifiers?.lineage || null,
        cousin_degree: qualifiers?.cousin_degree || null,
        cousin_removed: qualifiers?.cousin_removed || null,
        level: qualifiers?.level || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pending relative:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }
    
    // TODO: In future, send invitation email/SMS here
    // sendInvitation(data.invitation_token, email, phone);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/relatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch pending relatives invited by current user
    const { data, error } = await supabase
      .from('pending_relatives')
      .select('*')
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending relatives:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending relatives' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/relatives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
