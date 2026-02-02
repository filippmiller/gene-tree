import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

export interface FamilyStats {
  memberCount: number;
  generationCount: number;
  storyCount: number;
  recentActivity: {
    type: 'story' | 'photo' | 'member';
    description: string;
    timestamp: string;
  } | null;
}

/**
 * Get family statistics for a user's connected family network.
 * Used to display social proof on invitation welcome screens.
 */
export async function getFamilyStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FamilyStats> {
  // Get count of unique family members connected to this user
  // (either as user1 or user2 in relationships)
  const { count: relCount1 } = await supabase
    .from('relationships')
    .select('user2_id', { count: 'exact', head: true })
    .eq('user1_id', userId);

  const { count: relCount2 } = await supabase
    .from('relationships')
    .select('user1_id', { count: 'exact', head: true })
    .eq('user2_id', userId);

  // Also count pending relatives
  const { count: pendingCount } = await supabase
    .from('pending_relatives')
    .select('id', { count: 'exact', head: true })
    .eq('invited_by', userId);

  const memberCount = Math.max(
    (relCount1 || 0) + (relCount2 || 0) + (pendingCount || 0) + 1, // +1 for the user themselves
    1
  );

  // Estimate generations based on relationship levels
  // For now, use a simple heuristic: check max depth in ancestor_cache if available
  let generationCount = 1;
  const { data: ancestorData } = await supabase
    .from('ancestor_cache')
    .select('depth')
    .eq('user_id', userId)
    .order('depth', { ascending: false })
    .limit(1);

  if (ancestorData && ancestorData.length > 0) {
    generationCount = Math.max(ancestorData[0].depth + 1, 1);
  } else {
    // Fallback: count parent/grandparent relationships
    const { data: parentRels } = await supabase
      .from('relationships')
      .select('relationship_type')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .in('relationship_type', ['parent', 'grandparent', 'great_grandparent'])
      .limit(10);

    if (parentRels && parentRels.length > 0) {
      const hasGrandparent = parentRels.some(r =>
        r.relationship_type === 'grandparent' || r.relationship_type === 'great_grandparent'
      );
      generationCount = hasGrandparent ? 3 : 2;
    }
  }

  // Count voice stories created by this user
  const { count: storyCount } = await supabase
    .from('voice_stories')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId);

  // Get recent activity
  const { data: recentEvent } = await supabase
    .from('activity_events')
    .select('event_type, created_at, display_data')
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let recentActivity: FamilyStats['recentActivity'] = null;
  if (recentEvent) {
    const displayData = recentEvent.display_data as Record<string, unknown> | null;
    let description = '';
    let type: 'story' | 'photo' | 'member' = 'member';

    if (recentEvent.event_type.includes('story')) {
      type = 'story';
      description = (displayData?.title as string) || 'a new story';
    } else if (recentEvent.event_type.includes('photo') || recentEvent.event_type.includes('media')) {
      type = 'photo';
      description = 'a family photo';
    } else {
      type = 'member';
      description = 'a family member';
    }

    recentActivity = {
      type,
      description,
      timestamp: recentEvent.created_at || new Date().toISOString(),
    };
  }

  return {
    memberCount,
    generationCount: Math.max(generationCount, 1),
    storyCount: storyCount || 0,
    recentActivity,
  };
}
