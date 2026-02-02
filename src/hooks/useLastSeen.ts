'use client';

/**
 * useLastSeen Hook
 *
 * Fetches last_seen_at timestamps for specified user IDs.
 * Used to display "Last seen X ago" for offline users.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface LastSeenData {
  last_seen_at: string | null;
  visible: boolean;
}

interface UseLastSeenResult {
  /**
   * Map of user IDs to their last seen data
   */
  lastSeenMap: Map<string, LastSeenData>;

  /**
   * Get last seen date for a specific user
   */
  getLastSeen: (userId: string) => Date | null;

  /**
   * Whether data is currently loading
   */
  isLoading: boolean;

  /**
   * Any error that occurred
   */
  error: Error | null;

  /**
   * Manually refresh the data
   */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching last_seen_at timestamps for users
 *
 * @param userIds - Array of user IDs to fetch last seen data for
 * @param options - Configuration options
 * @returns Last seen data and utilities
 *
 * @example
 * ```tsx
 * const { getLastSeen, isLoading } = useLastSeen(['user-1', 'user-2']);
 *
 * // Get last seen for a user
 * const lastSeen = getLastSeen('user-1');
 * ```
 */
export function useLastSeen(
  userIds: string[],
  options: { enabled?: boolean } = {}
): UseLastSeenResult {
  const { enabled = true } = options;

  const [lastSeenMap, setLastSeenMap] = useState<Map<string, LastSeenData>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track previous userIds to avoid unnecessary fetches
  const prevUserIdsRef = useRef<string[]>([]);

  const fetchLastSeen = useCallback(async () => {
    if (!enabled || userIds.length === 0) {
      return;
    }

    // Check if userIds have changed
    const sortedIds = [...userIds].sort();
    const prevSorted = [...prevUserIdsRef.current].sort();
    const idsChanged = JSON.stringify(sortedIds) !== JSON.stringify(prevSorted);

    if (!idsChanged && lastSeenMap.size > 0) {
      return;
    }

    prevUserIdsRef.current = userIds;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/presence/last-seen?ids=${userIds.join(',')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch last seen data');
      }

      const data = await response.json();

      const newMap = new Map<string, LastSeenData>();
      if (data.users) {
        Object.entries(data.users).forEach(([userId, userData]) => {
          newMap.set(userId, userData as LastSeenData);
        });
      }

      setLastSeenMap(newMap);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userIds, enabled, lastSeenMap.size]);

  // Get last seen date for a specific user
  const getLastSeen = useCallback(
    (userId: string): Date | null => {
      const data = lastSeenMap.get(userId);
      if (!data || !data.last_seen_at) {
        return null;
      }
      return new Date(data.last_seen_at);
    },
    [lastSeenMap]
  );

  // Initial fetch
  useEffect(() => {
    fetchLastSeen();
  }, [fetchLastSeen]);

  return {
    lastSeenMap,
    getLastSeen,
    isLoading,
    error,
    refresh: fetchLastSeen,
  };
}

export default useLastSeen;
