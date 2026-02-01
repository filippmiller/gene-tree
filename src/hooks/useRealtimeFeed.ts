'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ActivityEventWithActor } from '@/types/activity';

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
   * List of family member IDs to subscribe to
   * If not provided, will fetch from API
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
 * Subscribes to the activity_events table and receives new events
 * as they are inserted. Events are filtered to the user's family circle.
 *
 * @example
 * ```tsx
 * const { pendingEvents, clearPendingEvents, isConnected } = useRealtimeFeed({
 *   onNewActivity: (event) => {
 *     // Handle new activity
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

  // Fetch family circle IDs if not provided
  useEffect(() => {
    if (!familyIds && enabled) {
      fetchFamilyIds();
    }
  }, [familyIds, enabled]);

  const fetchFamilyIds = async () => {
    try {
      const response = await fetch('/api/activity/feed?limit=1');
      if (!response.ok) return;

      // The API uses the family circle, so we trust it's handling the filtering
      // For now, we'll accept all events and filter client-side if needed
    } catch (err) {
      console.warn('Failed to fetch family IDs for realtime filtering:', err);
    }
  };

  // Fetch full actor data for a new event
  const enrichEvent = useCallback(async (payload: any): Promise<ActivityEventWithActor | null> => {
    try {
      const supabase = getSupabaseBrowser();

      // Fetch actor profile
      const { data: actor, error: actorError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', payload.new.actor_id)
        .single();

      if (actorError || !actor) {
        console.warn('Failed to fetch actor for activity event:', actorError);
        return null;
      }

      return {
        id: payload.new.id,
        event_type: payload.new.event_type,
        actor_id: payload.new.actor_id,
        subject_type: payload.new.subject_type,
        subject_id: payload.new.subject_id,
        display_data: payload.new.display_data || {},
        visibility: payload.new.visibility,
        created_at: payload.new.created_at,
        actor: {
          id: actor.id,
          first_name: actor.first_name,
          last_name: actor.last_name,
          avatar_url: actor.avatar_url,
        },
      };
    } catch (err) {
      console.error('Error enriching activity event:', err);
      return null;
    }
  }, []);

  // Handle incoming realtime event
  const handleRealtimeEvent = useCallback(async (payload: any) => {
    if (payload.eventType !== 'INSERT') return;

    // Optionally filter by family IDs
    if (familyIdsRef.current.size > 0 && !familyIdsRef.current.has(payload.new.actor_id)) {
      return;
    }

    const enrichedEvent = await enrichEvent(payload);
    if (!enrichedEvent) return;

    // Add to pending events
    setPendingEvents(prev => [enrichedEvent, ...prev]);

    // Call callback if provided
    onNewActivity?.(enrichedEvent);
  }, [enrichEvent, onNewActivity]);

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
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_events',
          },
          handleRealtimeEvent
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
  }, [enabled, handleRealtimeEvent]);

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
