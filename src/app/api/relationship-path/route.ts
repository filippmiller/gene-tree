/**
 * API: /api/relationship-path
 *
 * Find the relationship path between two people in the family tree
 * Uses BFS to find shortest path through the unified pending_relatives table
 */

import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import {
  buildRelationshipGraph,
  findPathBFS,
  type PathStep,
} from '@/lib/relationships/path-finder';
import {
  calculateRelationshipDegree,
  getDegreesOfSeparation,
} from '@/lib/relationships/degree-calculator';

export interface RelationshipPathResponse {
  success: boolean;
  result?: {
    found: boolean;
    pathLength: number;
    path: PathStep[];
    relationshipLabel: string;
    relationshipDescription: string;
    degreeOfSeparation: string;
    category: 'direct' | 'extended' | 'cousin' | 'in-law' | 'other';
  };
  error?: string;
}

/**
 * GET /api/relationship-path?person1=UUID&person2=UUID&locale=en&maxDepth=15
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<RelationshipPathResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const person1Id = url.searchParams.get('person1');
    const person2Id = url.searchParams.get('person2');
    const locale = (url.searchParams.get('locale') || 'en') as 'en' | 'ru';
    const maxDepth = Math.min(parseInt(url.searchParams.get('maxDepth') || '15'), 20);

    if (!person1Id || !person2Id) {
      return NextResponse.json<RelationshipPathResponse>(
        { success: false, error: 'person1 and person2 parameters are required' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(person1Id) || !uuidRegex.test(person2Id)) {
      return NextResponse.json<RelationshipPathResponse>(
        { success: false, error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Fetch all data needed for graph building
    const [userProfilesResult, pendingRelativesResult] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url, gender'),
      supabaseAdmin
        .from('pending_relatives')
        .select('id, invited_by, first_name, last_name, relationship_type, is_pending, is_verified'),
    ]);

    if (userProfilesResult.error) {
      console.error('Error fetching user_profiles:', userProfilesResult.error);
      return NextResponse.json<RelationshipPathResponse>(
        { success: false, error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    if (pendingRelativesResult.error) {
      console.error('Error fetching pending_relatives:', pendingRelativesResult.error);
      return NextResponse.json<RelationshipPathResponse>(
        { success: false, error: 'Failed to fetch relationships' },
        { status: 500 }
      );
    }

    const userProfiles = userProfilesResult.data || [];
    const pendingRelatives = pendingRelativesResult.data || [];

    // Build the relationship graph
    const { nodes, adjacency } = buildRelationshipGraph(userProfiles, pendingRelatives);

    // Find path using BFS
    const pathResult = findPathBFS(nodes, adjacency, person1Id, person2Id, maxDepth);

    if (!pathResult.found) {
      return NextResponse.json<RelationshipPathResponse>({
        success: true,
        result: {
          found: false,
          pathLength: 0,
          path: [],
          relationshipLabel: locale === 'ru' ? 'Связь не найдена' : 'No connection found',
          relationshipDescription: '',
          degreeOfSeparation: locale === 'ru' ? 'Не связаны' : 'Not connected',
          category: 'other',
        },
      });
    }

    // Calculate relationship degree
    const degree = calculateRelationshipDegree(pathResult.path, locale);
    const degreeOfSeparation = getDegreesOfSeparation(pathResult.pathLength, locale);

    return NextResponse.json<RelationshipPathResponse>({
      success: true,
      result: {
        found: true,
        pathLength: pathResult.pathLength,
        path: pathResult.path,
        relationshipLabel: degree.label,
        relationshipDescription: degree.description,
        degreeOfSeparation,
        category: degree.category,
      },
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/relationship-path:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<RelationshipPathResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
