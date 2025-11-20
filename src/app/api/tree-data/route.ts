/**
 * API: /api/tree-data
 * Returns tree data for visualization from pending_relatives
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface PendingRelative {
  id: string;
  invited_by: string;
  first_name: string;
  last_name: string;
  email: string | null;
  relationship_type: string;
  related_to_user_id: string | null;
  related_to_relationship: string | null;
  date_of_birth: string | null;
  is_deceased: boolean;
  role_for_a?: string | null;  // Optional - added in migration 0029
  role_for_b?: string | null;  // Optional - added in migration 0029
  marriage_date?: string | null;  // Optional - added in migration 0029
  divorce_date?: string | null;  // Optional - added in migration 0029
}

export async function GET(request: NextRequest) {
  // Get auth from SSR (cookies)
  const supabaseSSR = await getSupabaseSSR();
  
  const {
    data: { user },
    error: authError,
  } = await supabaseSSR.auth.getUser();

  if (authError || !user) {
    console.error('[TREE-DATA] Auth error:', authError);
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

    // If rootProfile not found, rootId might be a pending_relative
    let actualRootProfile: any = rootProfile;
    
    if (rootError) {
      const { data: pendingRoot } = await getSupabaseAdmin()
        .from('pending_relatives')
        .select('*')
        .eq('id', rootId)
        .single();
      
      if (!pendingRoot) {
        throw new Error('Root person not found in user_profiles or pending_relatives');
      }
      
      // Map pending_relative to user_profile-like structure
      actualRootProfile = {
        id: pendingRoot.id,
        first_name: pendingRoot.first_name,
        last_name: pendingRoot.last_name,
        gender: null,
        birth_date: pendingRoot.date_of_birth,
        death_date: null,
        avatar_url: null,
      };
    }

    // Get ALL relatives from entire family tree (not just from rootId)
    // Strategy: find the "invited_by" user and get all their relatives
    const { data: allPendingRels, error: allRelError } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select('*');

    if (allRelError) throw allRelError;

    // Find all relatives connected to rootId (either as invited_by or as relative)
    const connectedUserIds = new Set<string>([rootId]);
    const allRelatives: PendingRelative[] = [];
    
    // Find who created rootId's relatives
    for (const rel of (allPendingRels || [])) {
      if (rel.id === rootId) {
        connectedUserIds.add(rel.invited_by);
      }
      if (rel.invited_by === rootId) {
        allRelatives.push(rel);
        connectedUserIds.add(rel.id);
      }
    }
    
    // Get all relatives from connected users
    for (const rel of (allPendingRels || [])) {
      if (connectedUserIds.has(rel.invited_by) && !allRelatives.find(r => r.id === rel.id)) {
        allRelatives.push(rel);
        connectedUserIds.add(rel.id);
      }
    }

    // Build persons array
    const persons = [
      {
        id: actualRootProfile.id,
        name: `${actualRootProfile.first_name || ''} ${actualRootProfile.last_name || ''}`.trim() || 'Unknown',
        gender: actualRootProfile.gender || null,
        birth_date: actualRootProfile.birth_date || null,
        death_date: actualRootProfile.death_date || null,
        photo_url: actualRootProfile.avatar_url || null,
        is_alive: !actualRootProfile.death_date,
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

    // Build unions (marriages) from spouse relationships
    const unions: any[] = [];
    const unionChildren: any[] = [];
    
    for (const rel of allRelatives) {
      if (rel.relationship_type === 'spouse') {
        const unionId = crypto.randomUUID();
        unions.push({
          union_id: unionId,
          p1: rel.invited_by,
          p2: rel.id,
          role_p1: rel.role_for_a || 'partner',  // Default to 'partner' if not set
          role_p2: rel.role_for_b || 'partner',
          marriage_date: rel.marriage_date || null,
          divorce_date: rel.divorce_date || null,
        });
        
        // Find children of this union
        for (const childRel of allRelatives) {
          if (childRel.relationship_type === 'child') {
            // Check if this child belongs to either parent in the union
            if (childRel.invited_by === rel.invited_by || childRel.invited_by === rel.id) {
              unionChildren.push({
                union_id: unionId,
                child_id: childRel.id,
              });
            }
          }
        }
      }
    }

    const treeData = {
      persons,
      parentChild: parent_child_links,  // camelCase for TypeScript
      unions,
      unionChildren,  // camelCase for TypeScript
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

