/**
 * API: /api/tree-data
 * Returns tree data for visualization from pending_relatives
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface PendingRelative {
  id: string;
  invited_by: string;
  first_name: string;
  last_name: string;
  email: string;
  relationship_type: string;
  related_to_user_id: string | null;
  related_to_relationship: string | null;
  date_of_birth: string | null;
  is_deceased: boolean;
}

export async function GET(request: NextRequest) {
  // Using getSupabaseAdmin()

  const {
    data: { user },
    error: authError,
  } = await getSupabaseAdmin().auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const rootId = searchParams.get('root_id') || user.id;

  try {
    // Get user profile for root person
    const { data: rootProfile, error: rootError } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('*')
      .eq('id', rootId)
      .single();

    if (rootError) throw rootError;

    // Get ALL relatives from pending_relatives (both pending and verified)
    const { data: relatives, error: relError } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select('*')
      .eq('invited_by', rootId);

    if (relError) throw relError;

    const allRelatives = (relatives || []) as PendingRelative[];

    // Build persons array
    const persons = [
      {
        id: rootProfile.id,
        name: `${rootProfile.first_name || ''} ${rootProfile.last_name || ''}`.trim() || 'Unknown',
        gender: rootProfile.gender || null,
        birth_date: rootProfile.birth_date || null,
        death_date: rootProfile.death_date || null,
        photo_url: rootProfile.avatar_url || null,
        is_alive: !rootProfile.death_date,
      },
    ];

    // Add all relatives as persons
    for (const rel of allRelatives) {
      persons.push({
        id: rel.id,
        name: `${rel.first_name} ${rel.last_name}`,
        gender: null,
        birth_date: rel.date_of_birth,
        death_date: null,
        photo_url: null,
        is_alive: !rel.is_deceased,
      });
    }

    // Build parent_child links from unified table with proper chain handling
    const parent_child_links = [];
    
    for (const rel of allRelatives) {
      if (rel.relationship_type === 'parent') {
        // Check if this is a grandparent (has related_to_user_id)
        if (rel.related_to_user_id && rel.related_to_relationship === 'parent') {
          // This is grandparent: rel -> related_to_user_id (not root)
          parent_child_links.push({
            parent_id: rel.id,
            child_id: rel.related_to_user_id,  // Link to intermediate parent (Kirill)
          });
        } else {
          // Direct parent: rel -> invited_by
          parent_child_links.push({
            parent_id: rel.id,
            child_id: rel.invited_by,
          });
        }
      } else if (rel.relationship_type === 'child') {
        // rel is child of invited_by
        parent_child_links.push({
          parent_id: rel.invited_by,
          child_id: rel.id,
        });
      }
    }

    // Build unions (marriages) - simplified
    const unions: any[] = [];

    const treeData = {
      persons,
      parentChild: parent_child_links,  // camelCase for TypeScript
      unions,
      unionChildren: [],  // camelCase for TypeScript
    };

    return NextResponse.json(treeData);
  } catch (error) {
    console.error('[TREE-DATA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tree data' },
      { status: 500 }
    );
  }
}

