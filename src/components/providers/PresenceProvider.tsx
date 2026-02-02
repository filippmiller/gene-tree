'use client';

/**
 * PresenceProvider
 *
 * Global provider for online presence tracking.
 * Initializes presence tracking when user is authenticated
 * and provides presence state to the entire app via context.
 */

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { usePresence } from '@/hooks/usePresence';
import { cleanupPresence } from '@/lib/presence';

interface PresenceContextValue {
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

const PresenceContext = createContext<PresenceContextValue | null>(null);

interface PresenceProviderProps {
  /**
   * Current authenticated user ID
   */
  userId: string | null;

  /**
   * Children to render
   */
  children: ReactNode;

  /**
   * Whether presence tracking is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Provider component for global presence tracking
 */
export function PresenceProvider({
  userId,
  children,
  enabled = true,
}: PresenceProviderProps) {
  const { onlineUsers, isOnline, isConnected, error } = usePresence(userId, {
    enabled,
  });

  // Cleanup presence when user logs out
  useEffect(() => {
    if (!userId) {
      cleanupPresence();
    }
  }, [userId]);

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        isOnline,
        isConnected,
        error,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

/**
 * Hook to access presence context
 *
 * @returns Presence context value
 * @throws If used outside PresenceProvider
 *
 * @example
 * ```tsx
 * function FamilyMemberCard({ member }) {
 *   const { isOnline } = usePresenceContext();
 *
 *   return (
 *     <AvatarWithPresence
 *       src={member.avatar}
 *       fallback={member.initials}
 *       isOnline={isOnline(member.id)}
 *     />
 *   );
 * }
 * ```
 */
export function usePresenceContext(): PresenceContextValue {
  const context = useContext(PresenceContext);

  if (!context) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }

  return context;
}

/**
 * Optional hook that returns null if outside provider
 * (useful for components that may be used outside presence context)
 */
export function usePresenceContextOptional(): PresenceContextValue | null {
  return useContext(PresenceContext);
}

export default PresenceProvider;
