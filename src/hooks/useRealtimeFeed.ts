'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ActivityEventWithActor, ActivityEventType } from '@/types/activity';

interface UseRealtimeFeedOptions {
  /**
   * Whether to enable real-time subscriptions
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback when a new activity event is received
   */
  onNewActivity?: (event: ActivityEventWithActor) => void;
  /**
   * List of family member IDs to filter events
   * If not provided, all events will be shown
   */
  familyIds?: string[];
}

interface UseRealtimeFeedResult {
  /**
   * Whether the subscription is currently connected
   */
  isConnected: boolean;
  /**
   * Any error that occurred during subscription
   */
  error: Error | null;
  /**
   * New events received since last fetch (not yet in main list)
   */
  pendingEvents: ActivityEventWithActor[];
  /**
   * Clear pending events (call after incorporating into main list)
   */
  clearPendingEvents: () => void;
  /**
   * Manually reconnect to real-time
   */
  reconnect: () => void;
}

/**
 * Hook for subscribing to real-time activity feed updates
 *
 * Uses a hybrid approach:
 * 1. Subscribes to activity_events table for trigger-based events
 * 2. Also subscribes to source tables (pending_relatives, photos) for direct events
 *
 * @example
 * ```tsx
 * const { pendingEvents, clearPendingEvents, isConnected } = useRealtimeFeed({
 *   onNewActivity: (event) => {
 *     console.log('New activity:', event);
 *   }
 * });
 * ```
 */
export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}): UseRealtimeFeedResult {
  const { enabled = true, onNewActivity, familyIds } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingEvents, setPendingEvents] = useState<ActivityEventWithActor[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const familyIdsRef = useRef<Set<string>>(new Set(familyIds || []));

  // Update family IDs ref when prop changes
  useEffect(() => {
    if (familyIds) {
      familyIdsRef.current = new Set(familyIds);
    }
  }, [familyIds]);

  // Fetch actor profile by ID
  const fetchActorProfile = useCallback(async (actorId: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: actor, error: actorError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', actorId)
        .single();

      if (actorError || !actor) {
        console.warn('Failed to fetch actor profile:', actorError);
        return null;
      }

      return {
        id: actor.id,
        first_name: actor.first_name,
        last_name: actor.last_name,
        avatar_url: actor.avatar_url,
      };
    } catch (err) {
      console.error('Error fetching actor profile:', err);
      return null;
    }
  }, []);

  // Handle activity_events table changes
  const handleActivityEventInsert = useCallback(async (payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType !== 'INSERT') return;

    const newRecord = payload.new;

    // Filter by family IDs if provided
    if (familyIdsRef.current.size > 0 && !familyIdsRef.current.has(newRecord.actor_id)) {
      return;
    }

    const actor = await fetchActorProfile(newRecord.actor_id);
    if (!actor) return;

    const enrichedEvent: ActivityEventWithActor = {
      id: newRecord.id,
      event_type: newRecord.event_type as ActivityEventType,
      actor_id: newRecord.actor_id,
      subject_type: newRecord.subject_type,
      subject_id: newRecord.subject_id,
      display_data: newRecord.display_data || {},
      visibility: newRecord.visibility,
      created_at: newRecord.created_at,
      actor,
    };

    setPendingEvents(prev => [enrichedEvent, ...prev]);
    onNewActivity?.(enrichedEvent);
  }, [fetchActorProfile, onNewActivity]);

  // Handle pending_relatives table changes (relative_added)
  const handlePendingRelativeInsert = useCallback(async (payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType !== 'INSERT') return;

    const newRecord = payload.new;

    // Filter by family IDs if provided
    if (familyIdsRef.current.size > 0 && !familyIdsRef.current.has(newRecord.invited_by)) {
      return;
    }

    const actor = await fetchActorProfile(newRecord.invited_by);
    if (!actor) return;

    const enrichedEvent: ActivityEventWithActor = {
      id: `relative-${newRecord.id}`,
      event_type: 'relative_added',
      actor_id: newRecord.invited_by,
      subject_type: 'profile',
      subject_id: newRecord.id,
      display_data: {
        actor_name: `${actor.first_name} ${actor.last_name}`,
        related_profile_name: `${newRecord.first_name} ${newRecord.last_name}`,
        relationship_type: newRecord.relationship_type,
      },
      visibility: 'family',
      created_at: newRecord.created_at,
      actor,
    };

    setPendingEvents(prev => [enrichedEvent, ...prev]);
    onNewActivity?.(enrichedEvent);
  }, [fetchActorProfile, onNewActivity]);

  // Handle photos table changes (photo_added)
  const handlePhotoInsert = useCallback(async (payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;

    const newRecord = payload.new;

    // Only show approved photos
    if (newRecord.status !== 'approved') return;

    // For UPDATE, only show if status just changed to approved
    if (payload.eventType === 'UPDATE') {
      const oldRecord = payload.old;
      if (oldRecord?.status === 'approved') return; // Already was approved
    }

    // Filter by family IDs if provided
    if (familyIdsRef.current.size > 0 && !familyIdsRef.current.has(newRecord.uploaded_by)) {
      return;
    }

    const actor = await fetchActorProfile(newRecord.uploaded_by);
    if (!actor) return;

    // Fetch target profile if available
    let targetName = null;
    if (newRecord.target_profile_id) {
      const target = await fetchActorProfile(newRecord.target_profile_id);
      if (target) {
        targetName = `${target.first_name} ${target.last_name}`;
      }
    }

    const enrichedEvent: ActivityEventWithActor = {
      id: `photo-${newRecord.id}`,
      event_type: 'photo_added',
      actor_id: newRecord.uploaded_by,
      subject_type: 'photo',
      subject_id: newRecord.id,
      display_data: {
        actor_name: `${actor.first_name} ${actor.last_name}`,
        subject_title: newRecord.caption || 'a photo',
        related_profile_name: targetName,
        media_type: newRecord.type,
      },
      visibility: newRecord.visibility || 'family',
      created_at: newRecord.created_at,
      actor,
    };

    setPendingEvents(prev => [enrichedEvent, ...prev]);
    onNewActivity?.(enrichedEvent);
  }, [fetchActorProfile, onNewActivity]);

  // Subscribe to realtime
  const subscribe = useCallback(() => {
    if (!enabled) return;

    const supabase = getSupabaseBrowser();

    // Unsubscribe from existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    try {
      const channel = supabase
        .channel('activity-feed-realtime')
        // Subscribe to activity_events table (for trigger-based events)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_events',
          },
          handleActivityEventInsert
        )
        // Subscribe to pending_relatives table (for relative_added events)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pending_relatives',
          },
          handlePendingRelativeInsert
        )
        // Subscribe to photos table (for photo_added events)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT and UPDATE (for status changes)
            schema: 'public',
            table: 'photos',
          },
          handlePhotoInsert
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setError(null);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            if (status === 'CHANNEL_ERROR') {
              setError(new Error('Failed to connect to realtime channel'));
            }
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsConnected(false);
    }
  }, [enabled, handleActivityEventInsert, handlePendingRelativeInsert, handlePhotoInsert]);

  // Set up subscription on mount
  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseBrowser();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);

  const clearPendingEvents = useCallback(() => {
    setPendingEvents([]);
  }, []);

  const reconnect = useCallback(() => {
    setError(null);
    subscribe();
  }, [subscribe]);

  return {
    isConnected,
    error,
    pendingEvents,
    clearPendingEvents,
    reconnect,
  };
}

export default useRealtimeFeed;
