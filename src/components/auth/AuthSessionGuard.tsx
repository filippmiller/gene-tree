'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

/**
 * AuthSessionGuard - Client-side session expiration handler
 *
 * Monitors auth state changes and redirects to login when session expires.
 * Should be mounted once in the root layout.
 */
export function AuthSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = getSupabaseBrowser();
      // Listen for auth state changes (ONLY important events)
      const { data } = supabase.auth.onAuthStateChange((event) => {
        // Only log critical events, not every state change
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          logger.info('[AuthSessionGuard]', event);
        }

        // Redirect to login on sign out or expired session
        if (event === 'SIGNED_OUT') {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/sign-in')) {
            router.push('/en/sign-in');
          }
        }

        // If user signs in from another tab, refresh the page
        if (event === 'SIGNED_IN' && !window.location.pathname.includes('/sign-in')) {
          router.refresh();
        }
      });

      subscription = data.subscription;
    } catch (error) {
      // Auth subscription failed - this is OK, the user just won't get live updates
      console.warn('[AuthSessionGuard] Failed to subscribe to auth changes:', error);
    }

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return null; // This component doesn't render anything
}
