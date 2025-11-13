/**
 * TEMPORARY API: reads directly from pending_relatives
 * Bypasses broken VIEWs until migration is applied
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

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
  // Get user session from SSR (reads cookies)
  const supabase = await getSupabaseSSR();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[RELATIONSHIPS-TEMP] Auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const probandId = searchParams.get('proband_id') || user.id;

  try {
    // Fetch all pending_relatives for this user
    const { data: relatives, error } = await supabase
      .from('pending_relatives')
      .select('*')
      .eq('invited_by', probandId);

    if (error) throw error;

    const pendingRelatives = (relatives || []) as PendingRelative[];

    // Build relationship map
    const parents: any[] = [];
    const grandparents: any[] = [];
    const children: any[] = [];
    const grandchildren: any[] = [];
    const siblings: any[] = [];
    const spouses: any[] = [];

    // Track parent IDs for finding grandparents
    const parentIds = new Set<string>();

    for (const rel of pendingRelatives) {
      const person = {
        id: rel.id,
        name: `${rel.first_name} ${rel.last_name}`,
        gender: null,
        birth_date: rel.date_of_birth,
        death_date: null,
        photo_url: null,
        is_alive: !rel.is_deceased,
      };

      if (rel.relationship_type === 'parent') {
        if (rel.related_to_user_id && parentIds.has(rel.related_to_user_id)) {
          // Parent of a parent = grandparent
          grandparents.push(person);
        } else {
          // Direct parent
          parents.push(person);
          parentIds.add(rel.id);
        }
      } else if (rel.relationship_type === 'child') {
        children.push(person);
      } else if (rel.relationship_type === 'spouse') {
        spouses.push({
          ...person,
          marriage_date: null,
          divorce_date: null,
        });
      } else if (rel.relationship_type === 'sibling') {
        siblings.push(person);
      }
    }

    // Find grandparents: parents whose related_to_user_id points to a parent
    for (const rel of pendingRelatives) {
      if (
        rel.relationship_type === 'parent' &&
        rel.related_to_user_id &&
        parentIds.has(rel.related_to_user_id)
      ) {
        const person = {
          id: rel.id,
          name: `${rel.first_name} ${rel.last_name}`,
          gender: null,
          birth_date: rel.date_of_birth,
          death_date: null,
          photo_url: null,
          is_alive: !rel.is_deceased,
        };
        
        // Remove from parents if accidentally added
        const parentIndex = parents.findIndex(p => p.id === rel.id);
        if (parentIndex !== -1) {
          parents.splice(parentIndex, 1);
        }
        
        // Add to grandparents if not already there
        if (!grandparents.find(gp => gp.id === rel.id)) {
          grandparents.push(person);
        }
      }
    }

    console.log('[RELATIONSHIPS-TEMP] Stats:', {
      parents: parents.length,
      grandparents: grandparents.length,
      children: children.length,
      siblings: siblings.length,
      spouses: spouses.length,
    });

    return NextResponse.json({
      parents,
      grandparents,
      children,
      grandchildren,
      siblings,
      spouses,
    });
  } catch (error) {
    console.error('[RELATIONSHIPS-TEMP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}

