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
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    // Listen for auth state changes (ONLY important events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
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

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null; // This component doesn't render anything
}
