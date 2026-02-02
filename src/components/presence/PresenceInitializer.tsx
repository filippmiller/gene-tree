'use client';

/**
 * PresenceInitializer
 *
 * Client component that initializes presence tracking when the user is authenticated.
 * Placed in the protected layout to ensure presence is active for all authenticated routes.
 */

import { useEffect, useRef } from 'react';
import { initializePresence, cleanupPresence } from '@/lib/presence';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

interface PresenceInitializerProps {
  /**
   * Initial user ID from server
   */
  initialUserId: string;
}

export function PresenceInitializer({ initialUserId }: PresenceInitializerProps) {
  const initializedRef = useRef(false);
  const userIdRef = useRef(initialUserId);

  useEffect(() => {
    // Initialize presence for the user
    if (!initializedRef.current && initialUserId) {
      initializedRef.current = true;
      userIdRef.current = initialUserId;
      initializePresence(initialUserId);
    }

    // Handle auth state changes
    const supabase = getSupabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // User logged out - cleanup presence
        cleanupPresence();
        initializedRef.current = false;
      } else if (event === 'SIGNED_IN' && session?.user) {
        // User logged in - reinitialize if different user
        if (session.user.id !== userIdRef.current) {
          cleanupPresence().then(() => {
            userIdRef.current = session.user.id;
            initializePresence(session.user.id);
            initializedRef.current = true;
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      // Don't cleanup presence on unmount since other components may use it
      // Presence is cleaned up when user signs out
    };
  }, [initialUserId]);

  // This component doesn't render anything
  return null;
}

export default PresenceInitializer;
