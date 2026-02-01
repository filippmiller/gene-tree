/**
 * Profile Merge Service
 *
 * Handles merging two profiles into one while:
 * - Preserving all relationships from both profiles
 * - Keeping the most complete data
 * - Logging merge history for audit
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import type { ProfileData, MergeRequest, MergeResult, MergeHistory } from './types';

type SupabaseAdminClient = SupabaseClient<Database>;

/**
 * Fields that can be merged from one profile to another
 */
const MERGEABLE_FIELDS: (keyof ProfileData)[] = [
  'maiden_name',
  'nickname',
  'middle_name',
  'birth_date',
  'birth_place',
  'birth_city',
  'birth_country',
  'death_date',
  'death_place',
  'gender',
  'avatar_url',
  'occupation',
  'bio',
  'phone',
  'current_city',
  'current_country',
  'current_address',
  'is_living',
];

/**
 * Determine which fields should be merged from the merged profile to the kept profile
 * Prefers non-null values and more complete data
 */
function determineFieldsToMerge(
  keptProfile: ProfileData,
  mergedProfile: ProfileData,
  requestedFields?: string[]
): string[] {
  const fieldsToMerge: string[] = [];

  for (const field of MERGEABLE_FIELDS) {
    // Skip if not in requested fields (when specified)
    if (requestedFields && requestedFields.length > 0 && !requestedFields.includes(field)) {
      continue;
    }

    const keptValue = keptProfile[field];
    const mergedValue = mergedProfile[field];

    // Merge if kept profile is missing this field but merged has it
    if ((keptValue === null || keptValue === undefined || keptValue === '') &&
        mergedValue !== null && mergedValue !== undefined && mergedValue !== '') {
      fieldsToMerge.push(field);
    }

    // Special case: prefer longer bio
    if (field === 'bio' && typeof keptValue === 'string' && typeof mergedValue === 'string') {
      if (mergedValue.length > keptValue.length) {
        fieldsToMerge.push(field);
      }
    }
  }

  return fieldsToMerge;
}

/**
 * Build update object for the kept profile with merged data
 */
function buildProfileUpdate(
  mergedProfile: ProfileData,
  fieldsToMerge: string[]
): Partial<ProfileData> {
  const update: Partial<ProfileData> = {};

  for (const field of fieldsToMerge) {
    const value = mergedProfile[field as keyof ProfileData];
    if (value !== null && value !== undefined) {
      (update as Record<string, unknown>)[field] = value;
    }
  }

  return update;
}

/**
 * Transfer all relationships from merged profile to kept profile
 */
async function transferRelationships(
  supabase: SupabaseAdminClient,
  mergedProfileId: string,
  keptProfileId: string
): Promise<number> {
  let transferred = 0;

  // Get all relationships where merged profile is user1
  const { data: relationsAsUser1, error: error1 } = await supabase
    .from('relationships')
    .select('*')
    .eq('user1_id', mergedProfileId);

  if (error1) {
    console.error('[MergeService] Error fetching relationships as user1:', error1);
    throw new Error(`Failed to fetch relationships: ${error1.message}`);
  }

  // Get all relationships where merged profile is user2
  const { data: relationsAsUser2, error: error2 } = await supabase
    .from('relationships')
    .select('*')
    .eq('user2_id', mergedProfileId);

  if (error2) {
    console.error('[MergeService] Error fetching relationships as user2:', error2);
    throw new Error(`Failed to fetch relationships: ${error2.message}`);
  }

  // Transfer relationships where merged was user1
  for (const rel of relationsAsUser1 || []) {
    // Check if this relationship already exists for kept profile
    const { data: existing } = await supabase
      .from('relationships')
      .select('id')
      .or(`and(user1_id.eq.${keptProfileId},user2_id.eq.${rel.user2_id}),and(user1_id.eq.${rel.user2_id},user2_id.eq.${keptProfileId})`)
      .single();

    if (!existing) {
      // Update the relationship to point to kept profile
      const { error: updateError } = await supabase
        .from('relationships')
        .update({ user1_id: keptProfileId })
        .eq('id', rel.id);

      if (!updateError) {
        transferred++;
      } else {
        console.error('[MergeService] Error transferring relationship:', updateError);
      }
    } else {
      // Relationship already exists, delete the duplicate
      await supabase.from('relationships').delete().eq('id', rel.id);
    }
  }

  // Transfer relationships where merged was user2
  for (const rel of relationsAsUser2 || []) {
    // Check if this relationship already exists for kept profile
    const { data: existing } = await supabase
      .from('relationships')
      .select('id')
      .or(`and(user1_id.eq.${keptProfileId},user2_id.eq.${rel.user1_id}),and(user1_id.eq.${rel.user1_id},user2_id.eq.${keptProfileId})`)
      .single();

    if (!existing) {
      // Update the relationship to point to kept profile
      const { error: updateError } = await supabase
        .from('relationships')
        .update({ user2_id: keptProfileId })
        .eq('id', rel.id);

      if (!updateError) {
        transferred++;
      } else {
        console.error('[MergeService] Error transferring relationship:', updateError);
      }
    } else {
      // Relationship already exists, delete the duplicate
      await supabase.from('relationships').delete().eq('id', rel.id);
    }
  }

  return transferred;
}

/**
 * Merge two profiles into one
 *
 * @param supabase Supabase admin client (bypasses RLS)
 * @param request Merge request containing profile IDs
 * @param userId ID of the user performing the merge
 * @returns Merge result with success status and details
 */
export async function mergeProfiles(
  supabase: SupabaseAdminClient,
  request: MergeRequest,
  userId: string
): Promise<MergeResult> {
  const { duplicateId, keepProfileId, mergeProfileId, fieldsToMerge } = request;

  try {
    // Fetch both profiles
    const { data: keptProfile, error: keptError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', keepProfileId)
      .single();

    if (keptError || !keptProfile) {
      return { success: false, error: 'Profile to keep not found', relationshipsTransferred: 0 };
    }

    const { data: mergedProfile, error: mergedError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', mergeProfileId)
      .single();

    if (mergedError || !mergedProfile) {
      return { success: false, error: 'Profile to merge not found', relationshipsTransferred: 0 };
    }

    // Determine which fields to merge
    const fieldsToUpdate = determineFieldsToMerge(
      keptProfile as ProfileData,
      mergedProfile as ProfileData,
      fieldsToMerge
    );

    // Build and apply profile update
    const profileUpdate = buildProfileUpdate(mergedProfile as ProfileData, fieldsToUpdate);

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', keepProfileId);

      if (updateError) {
        console.error('[MergeService] Error updating kept profile:', updateError);
        return { success: false, error: `Failed to update profile: ${updateError.message}`, relationshipsTransferred: 0 };
      }
    }

    // Transfer relationships
    const relationshipsTransferred = await transferRelationships(
      supabase,
      mergeProfileId,
      keepProfileId
    );

    // Create merge history record
    const mergeData: MergeHistory['merge_data'] = {
      fields_from_merged: fieldsToUpdate,
      relationships_transferred: relationshipsTransferred,
      original_merged_data: mergedProfile as Partial<ProfileData>,
    };

    const { data: mergeHistory, error: historyError } = await supabase
      .from('merge_history')
      .insert({
        kept_profile_id: keepProfileId,
        merged_profile_id: mergeProfileId,
        merged_by: userId,
        duplicate_record_id: duplicateId,
        merge_data: mergeData,
        relationships_transferred: relationshipsTransferred,
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('[MergeService] Error creating merge history:', historyError);
      // Don't fail the merge, just log the error
    }

    // Update the duplicate record status
    if (duplicateId) {
      await supabase
        .from('potential_duplicates')
        .update({
          status: 'merged',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', duplicateId);
    }

    // Delete the merged profile (soft delete by marking as merged would be better in production)
    // For now, we'll keep it simple and actually delete
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', mergeProfileId);

    if (deleteError) {
      console.error('[MergeService] Error deleting merged profile:', deleteError);
      // The merge was successful, profile deletion is secondary
    }

    return {
      success: true,
      mergeHistoryId: mergeHistory?.id,
      relationshipsTransferred,
    };
  } catch (error) {
    console.error('[MergeService] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      relationshipsTransferred: 0,
    };
  }
}

/**
 * Mark a potential duplicate as "not a duplicate"
 */
export async function dismissDuplicate(
  supabase: SupabaseAdminClient,
  duplicateId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('potential_duplicates')
    .update({
      status: 'not_duplicate',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', duplicateId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get merge history for a profile
 */
export async function getMergeHistory(
  supabase: SupabaseAdminClient,
  profileId: string
): Promise<MergeHistory[]> {
  const { data, error } = await supabase
    .from('merge_history')
    .select('*')
    .or(`kept_profile_id.eq.${profileId},merged_profile_id.eq.${profileId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MergeService] Error fetching merge history:', error);
    return [];
  }

  return data as MergeHistory[];
}
