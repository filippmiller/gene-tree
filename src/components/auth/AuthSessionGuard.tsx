'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

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
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthSessionGuard] Auth event:', event, 'Session:', !!session);

      // Redirect to login on sign out or expired session
      if (event === 'SIGNED_OUT') {
        console.log('[AuthSessionGuard] Session expired, redirecting to login');
        
        // Show a brief message (optional - you can add toast library later)
        if (typeof window !== 'undefined') {
          // Simple alert for now - replace with proper toast/notification later
          alert('Your session has expired. Please login again.');
        }
        
        router.push('/en/sign-in');
      }

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthSessionGuard] Token refreshed successfully');
      }

      // If user signs in from another tab, refresh the page
      if (event === 'SIGNED_IN' && !window.location.pathname.includes('/sign-in')) {
        console.log('[AuthSessionGuard] User signed in, refreshing page');
        router.refresh();
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !window.location.pathname.includes('/sign-in')) {
        console.log('[AuthSessionGuard] No session on mount, redirecting');
        router.push('/en/sign-in');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null; // This component doesn't render anything
}
