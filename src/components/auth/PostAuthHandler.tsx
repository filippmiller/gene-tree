'use client';

import { useEffect, useRef } from 'react';

/**
 * PostAuthHandler - Runs once after authentication to link invitations
 * 
 * This component should be included in the protected layout.
 * It checks for accepted invitations that need to be linked to
 * the current user and updates the user profile accordingly.
 */
export default function PostAuthHandler() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasRun.current) return;
    hasRun.current = true;

    const linkInvitation = async () => {
      try {
        const response = await fetch('/api/auth/link-invitation', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.linked) {
            console.log('[PostAuthHandler] Invitation linked successfully');
            // Refresh the page to reflect profile updates
            window.location.reload();
          }
        }
      } catch (error) {
        // Silently fail - this is a best-effort operation
        console.error('[PostAuthHandler] Failed to link invitation:', error);
      }
    };

    linkInvitation();
  }, []);

  return null;
}
