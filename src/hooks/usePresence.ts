'use client';

/**
 * usePresence Hook
 *
 * React hook for managing online presence state.
 * Provides real-time tracking of which family members are online.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  initializePresence,
  getPresenceState,
  onPresenceSync,
  isPresenceActive,
  type PresenceState,
} from '@/lib/presence';

interface UsePresenceOptions {
  /**
   * Whether to enable presence tracking
   * @default true
   */
  enabled?: boolean;
}

interface UsePresenceResult {
  /**
   * Set of currently online user IDs
   */
  onlineUsers: Set<string>;

  /**
   * Check if a specific user is online
   */
  isOnline: (userId: string) => boolean;

  /**
   * Whether the presence connection is active
   */
  isConnected: boolean;

  /**
   * Any error that occurred
   */
  error: Error | null;
}

/**
 * Hook for tracking online presence of family members
 *
 * @param userId - Current user's ID (required to track own presence)
 * @param options - Configuration options
 * @returns Presence state and utilities
 *
 * @example
 * ```tsx
 * const { onlineUsers, isOnline, isConnected } = usePresence(currentUserId);
 *
 * // Check if specific user is online
 * if (isOnline(familyMemberId)) {
 *   // Show green dot
 * }
 * ```
 */
export function usePresence(
  userId: string | null,
  options: UsePresenceOptions = {}
): UsePresenceResult {
  const { enabled = true } = options;

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Handle presence state sync
  const handlePresenceSync = useCallback((state: PresenceState) => {
    if (!mountedRef.current) return;

    const onlineIds = new Set(Object.keys(state));
    setOnlineUsers(onlineIds);
  }, []);

  // Check if user is online
  const isOnline = useCallback(
    (checkUserId: string): boolean => {
      return onlineUsers.has(checkUserId);
    },
    [onlineUsers]
  );

  // Initialize presence on mount
  useEffect(() => {
    mountedRef.current = true;

    if (!userId || !enabled) {
      return;
    }

    let unsubscribeSync: (() => void) | null = null;

    const initialize = async () => {
      try {
        // Register sync callback before initializing
        unsubscribeSync = onPresenceSync(handlePresenceSync);

        // Initialize presence channel
        const success = await initializePresence(userId);

        if (mountedRef.current) {
          setIsConnected(success);
          if (success) {
            setError(null);
            // Get initial state
            const initialState = getPresenceState();
            setOnlineUsers(new Set(Object.keys(initialState)));
          } else {
            setError(new Error('Failed to connect to presence channel'));
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown presence error'));
          setIsConnected(false);
        }
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (unsubscribeSync) {
        unsubscribeSync();
      }
      // Note: We don't cleanup presence here as other components may still use it
      // The presence channel is cleaned up when the user logs out
    };
  }, [userId, enabled, handlePresenceSync]);

  // Watch for connection status changes
  useEffect(() => {
    const checkConnection = () => {
      if (mountedRef.current) {
        setIsConnected(isPresenceActive());
      }
    };

    // Check periodically
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    onlineUsers,
    isOnline,
    isConnected,
    error,
  };
}

export default usePresence;
