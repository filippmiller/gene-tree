import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { FindRelationshipPathResponse, PathNode } from '@/types/relationship-path';

/**
 * GET /api/relationship-path?person1=UUID&person2=UUID&maxDepth=10
 * Find the relationship path between two people
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const person1Id = url.searchParams.get('person1');
    const person2Id = url.searchParams.get('person2');
    const maxDepth = Math.min(parseInt(url.searchParams.get('maxDepth') || '10'), 15);

    if (!person1Id || !person2Id) {
      return NextResponse.json(
        { success: false, error: 'person1 and person2 parameters are required' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(person1Id) || !uuidRegex.test(person2Id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // If same person, return immediately
    if (person1Id === person2Id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', person1Id)
        .single() as { data: any };

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        result: {
          found: true,
          path_length: 0,
          path: [{
            profile_id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            relationship_to_next: null,
          }],
        },
      });
    }

    // Use BFS to find the path
    const result = await findPathBFS(supabase, person1Id, person2Id, maxDepth);

    const response: FindRelationshipPathResponse = {
      success: true,
      result,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error in GET /api/relationship-path:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface VisitedNode {
  profileId: string;
  depth: number;
  prevId: string | null;
  relationshipType: string | null;
}

async function findPathBFS(
  supabase: any,
  person1Id: string,
  person2Id: string,
  maxDepth: number
): Promise<{ found: boolean; path_length: number | null; path: PathNode[] }> {
  const visited = new Map<string, VisitedNode>();
  const queue: VisitedNode[] = [];

  // Initialize with person1
  visited.set(person1Id, {
    profileId: person1Id,
    depth: 0,
    prevId: null,
    relationshipType: null,
  });
  queue.push(visited.get(person1Id)!);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.depth >= maxDepth) continue;

    // Get all relationships for this person
    const { data: relationships } = await supabase
      .from('relationships')
      .select('profile_id_1, profile_id_2, relationship_type')
      .or(`profile_id_1.eq.${current.profileId},profile_id_2.eq.${current.profileId}`);

    if (!relationships) continue;

    for (const rel of relationships) {
      const neighborId =
        rel.profile_id_1 === current.profileId ? rel.profile_id_2 : rel.profile_id_1;

      if (visited.has(neighborId)) continue;

      const neighborNode: VisitedNode = {
        profileId: neighborId,
        depth: current.depth + 1,
        prevId: current.profileId,
        relationshipType: rel.relationship_type,
      };

      visited.set(neighborId, neighborNode);
      queue.push(neighborNode);

      // Found person2
      if (neighborId === person2Id) {
        return buildPath(supabase, visited, person1Id, person2Id);
      }
    }
  }

  // No path found
  return {
    found: false,
    path_length: null,
    path: [],
  };
}

async function buildPath(
  supabase: any,
  visited: Map<string, VisitedNode>,
  startId: string,
  endId: string
): Promise<{ found: boolean; path_length: number | null; path: PathNode[] }> {
  // Build path from end to start
  const pathIds: string[] = [];
  const relationships: (string | null)[] = [];

  let currentId: string | null = endId;
  while (currentId) {
    const node = visited.get(currentId);
    if (!node) break;

    pathIds.unshift(currentId);
    if (node.prevId) {
      relationships.unshift(node.relationshipType);
    }
    currentId = node.prevId;
  }

  // Fetch profile data for all nodes
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', pathIds) as { data: any[] | null };

  if (!profiles) {
    return { found: false, path_length: null, path: [] };
  }

  // Build path nodes in order
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const path: PathNode[] = pathIds.map((id, index) => {
    const profile = profileMap.get(id) as any;
    return {
      profile_id: id,
      first_name: profile?.first_name || 'Unknown',
      last_name: profile?.last_name || '',
      avatar_url: profile?.avatar_url || null,
      relationship_to_next: index < pathIds.length - 1 ? relationships[index] : null,
    };
  });

  return {
    found: true,
    path_length: pathIds.length - 1,
    path,
  };
}
