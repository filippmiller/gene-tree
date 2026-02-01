/**
 * Content Queries for Weekly Digest
 *
 * Functions to gather personalized content for each user's digest:
 * - Upcoming birthdays (next 7 days)
 * - New stories (last 7 days)
 * - "On this day" memories
 * - Pending invitations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DigestBirthday,
  DigestStory,
  DigestMemory,
  DigestInvitation
} from './weekly-digest-templates';

/**
 * Get day name from date
 */
function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string, referenceDate: Date): number {
  const birth = new Date(birthDate);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age + 1; // Age they will be turning
}

/**
 * Get days until birthday (considering only month/day)
 */
function getDaysUntilBirthday(birthDate: string, fromDate: Date): number {
  const birth = new Date(birthDate);
  const thisYear = fromDate.getFullYear();

  // Create date for this year's birthday
  let targetDate = new Date(thisYear, birth.getMonth(), birth.getDate());

  // If birthday has passed this year, check next year
  if (targetDate < fromDate) {
    targetDate = new Date(thisYear + 1, birth.getMonth(), birth.getDate());
  }

  const diffTime = targetDate.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get upcoming birthdays in the family circle (next 7 days)
 */
export async function getUpcomingBirthdays(
  supabase: SupabaseClient,
  userId: string
): Promise<DigestBirthday[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get family circle profile IDs
    const { data: familyCircle, error: familyError } = await supabase.rpc(
      'get_family_circle_profile_ids',
      { p_user_id: userId }
    );

    if (familyError || !familyCircle) {
      console.error('[Digest] Error getting family circle:', familyError);
      return [];
    }

    const familyIds = (familyCircle as { profile_id: string }[]).map(f => f.profile_id);

    if (familyIds.length === 0) return [];

    // Get profiles with birth dates
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, birth_date, avatar_url, is_living')
      .in('id', familyIds)
      .not('birth_date', 'is', null)
      .neq('is_living', false);

    if (profilesError || !profiles) {
      console.error('[Digest] Error getting profiles:', profilesError);
      return [];
    }

    // Filter to birthdays in next 7 days
    const birthdays: DigestBirthday[] = [];

    for (const profile of profiles) {
      if (!profile.birth_date) continue;

      const daysUntil = getDaysUntilBirthday(profile.birth_date, today);

      if (daysUntil >= 0 && daysUntil <= 7) {
        const birthdayDate = new Date(today);
        birthdayDate.setDate(birthdayDate.getDate() + daysUntil);

        birthdays.push({
          personName: `${profile.first_name} ${profile.last_name}`.trim(),
          dayName: daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : getDayName(birthdayDate),
          age: calculateAge(profile.birth_date, birthdayDate),
          profileId: profile.id,
          avatarUrl: profile.avatar_url || undefined
        });
      }
    }

    // Sort by days until birthday
    return birthdays.sort((a, b) => {
      const dayOrder = ['Today', 'Tomorrow', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayOrder.indexOf(a.dayName) - dayOrder.indexOf(b.dayName);
    });

  } catch (error) {
    console.error('[Digest] Error in getUpcomingBirthdays:', error);
    return [];
  }
}

/**
 * Get new stories from the last 7 days
 */
export async function getNewStories(
  supabase: SupabaseClient,
  userId: string
): Promise<DigestStory[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // Get family circle profile IDs
    const { data: familyCircle, error: familyError } = await supabase.rpc(
      'get_family_circle_profile_ids',
      { p_user_id: userId }
    );

    if (familyError || !familyCircle) {
      console.error('[Digest] Error getting family circle:', familyError);
      return [];
    }

    const familyIds = (familyCircle as { profile_id: string }[]).map(f => f.profile_id);

    if (familyIds.length === 0) return [];

    // Get stories from family members in the last 7 days
    // Note: Using 'as any' for type safety with dynamic column
    const { data: stories, error: storiesError } = await (supabase as any)
      .from('stories')
      .select(`
        id,
        title,
        content,
        media_type,
        created_at,
        author_id,
        user_profiles!stories_author_id_fkey (
          first_name,
          last_name
        )
      `)
      .in('author_id', familyIds)
      .eq('status', 'approved')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (storiesError || !stories) {
      console.error('[Digest] Error getting stories:', storiesError);
      return [];
    }

    return stories.map((story: any) => ({
      authorName: story.user_profiles
        ? `${story.user_profiles.first_name} ${story.user_profiles.last_name}`.trim()
        : 'A family member',
      title: story.title || '',
      preview: story.content?.substring(0, 80) || 'New story added',
      storyId: story.id,
      mediaType: story.media_type as 'text' | 'photo' | 'voice',
      createdAt: story.created_at
    }));

  } catch (error) {
    console.error('[Digest] Error in getNewStories:', error);
    return [];
  }
}

/**
 * Get "On This Day" memories
 * Historical events that happened on this week's dates in previous years
 */
export async function getOnThisDayMemories(
  supabase: SupabaseClient,
  userId: string
): Promise<DigestMemory[]> {
  const today = new Date();
  const thisMonth = today.getMonth() + 1;
  const thisDay = today.getDate();

  try {
    // Use the existing this-day function if available
    const { data: events, error } = await (supabase as any).rpc('get_this_day_events', {
      p_user_id: userId,
      p_month: thisMonth,
      p_day: thisDay
    });

    if (error) {
      // Function may not exist, return empty
      console.log('[Digest] get_this_day_events not available:', error.message);
      return [];
    }

    if (!events || events.length === 0) return [];

    // Transform to digest format
    return events
      .filter((e: any) => e.years_ago && e.years_ago > 0)
      .slice(0, 3) // Limit to 3 memories
      .map((event: any) => ({
        title: event.display_title,
        yearsAgo: event.years_ago,
        eventType: event.event_type === 'anniversary' ? 'anniversary' as const : 'photo' as const,
        profileId: event.profile_id
      }));

  } catch (error) {
    console.error('[Digest] Error in getOnThisDayMemories:', error);
    return [];
  }
}

/**
 * Get pending invitations for the user
 */
export async function getPendingInvitations(
  supabase: SupabaseClient,
  userEmail: string
): Promise<DigestInvitation[]> {
  try {
    const { data: invites, error } = await supabase
      .from('pending_relatives')
      .select(`
        id,
        relationship_type,
        invitation_token,
        invited_by
      `)
      .eq('email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !invites) {
      console.error('[Digest] Error getting invites:', error);
      return [];
    }

    // Get inviter names
    const result: DigestInvitation[] = [];

    for (const invite of invites) {
      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', invite.invited_by)
        .single();

      result.push({
        inviterName: inviter
          ? `${inviter.first_name} ${inviter.last_name}`.trim()
          : 'A family member',
        relationshipType: formatRelationshipType(invite.relationship_type),
        inviteToken: invite.invitation_token
      });
    }

    return result;

  } catch (error) {
    console.error('[Digest] Error in getPendingInvitations:', error);
    return [];
  }
}

/**
 * Format relationship type for display
 */
function formatRelationshipType(type: string): string {
  const mapping: Record<string, string> = {
    parent: 'parent',
    child: 'child',
    spouse: 'spouse',
    sibling: 'sibling',
    grandparent: 'grandparent',
    grandchild: 'grandchild',
    aunt_uncle: 'aunt/uncle',
    niece_nephew: 'niece/nephew',
    cousin: 'cousin'
  };

  return mapping[type] || type.replace(/_/g, ' ');
}

/**
 * Gather all content for a user's digest
 */
export async function gatherDigestContent(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<{
  birthdays: DigestBirthday[];
  stories: DigestStory[];
  memories: DigestMemory[];
  pendingInvites: DigestInvitation[];
}> {
  // Run queries in parallel for efficiency
  const [birthdays, stories, memories, pendingInvites] = await Promise.all([
    getUpcomingBirthdays(supabase, userId),
    getNewStories(supabase, userId),
    getOnThisDayMemories(supabase, userId),
    getPendingInvitations(supabase, userEmail)
  ]);

  return { birthdays, stories, memories, pendingInvites };
}
