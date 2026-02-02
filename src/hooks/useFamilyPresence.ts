'use client';

/**
 * useFamilyPresence Hook
 *
 * Combines real-time presence with last_seen_at data for family members.
 * This hook is optimized for displaying presence across multiple family members.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePresence } from './usePresence';
import { useLastSeen } from './useLastSeen';

interface FamilyPresenceData {
  /**
   * Whether the user is currently online
   */
  isOnline: boolean;

  /**
   * Last seen timestamp (null if never seen or online)
   */
  lastSeen: Date | null;

  /**
   * Whether the user has hidden their presence
   */
  presenceHidden: boolean;
}

interface UseFamilyPresenceOptions {
  /**
   * Whether to enable presence tracking
   * @default true
   */
  enabled?: boolean;

  /**
   * How often to refresh last_seen_at data (ms)
   * @default 60000 (1 minute)
   */
  refreshInterval?: number;
}

interface UseFamilyPresenceResult {
  /**
   * Get presence data for a specific user
   */
  getPresence: (userId: string) => FamilyPresenceData;

  /**
   * Whether the presence connection is active
   */
  isConnected: boolean;

  /**
   * Whether last seen data is loading
   */
  isLoading: boolean;

  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * Hook for tracking presence of multiple family members
 *
 * @param currentUserId - Current user's ID (required for presence tracking)
 * @param familyMemberIds - Array of family member user IDs to track
 * @param options - Configuration options
 * @returns Presence data and utilities
 *
 * @example
 * ```tsx
 * const { getPresence, isConnected } = useFamilyPresence(
 *   currentUserId,
 *   familyMembers.map(m => m.id)
 * );
 *
 * // Get presence for a specific family member
 * const { isOnline, lastSeen } = getPresence(memberId);
 * ```
 */
export function useFamilyPresence(
  currentUserId: string | null,
  familyMemberIds: string[],
  options: UseFamilyPresenceOptions = {}
): UseFamilyPresenceResult {
  const { enabled = true, refreshInterval = 60000 } = options;

  // Real-time presence tracking
  const { onlineUsers, isOnline: isOnlineRealtime, isConnected, error: presenceError } = usePresence(
    currentUserId,
    { enabled }
  );

  // Last seen data for offline users
  const { getLastSeen, isLoading, error: lastSeenError, refresh } = useLastSeen(
    familyMemberIds,
    { enabled }
  );

  // Periodically refresh last seen data
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, refresh]);

  // Get presence data for a specific user
  const getPresence = useCallback(
    (userId: string): FamilyPresenceData => {
      const isOnline = isOnlineRealtime(userId);
      const lastSeen = getLastSeen(userId);

      return {
        isOnline,
        lastSeen: isOnline ? null : lastSeen,
        presenceHidden: false, // Will be set by last seen API if user has hidden presence
      };
    },
    [isOnlineRealtime, getLastSeen]
  );

  // Combined error
  const error = presenceError || lastSeenError;

  return {
    getPresence,
    isConnected,
    isLoading,
    error,
  };
}

export default useFamilyPresence;
