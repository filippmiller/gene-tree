'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function InvitationChecker() {
    const router = useRouter();
    const pathname = usePathname();
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Don't check if we are already on the onboarding page
        if (pathname?.includes('/onboarding/invites')) {
            return;
        }

        const checkInvites = async () => {
            try {
                const response = await fetch('/api/invites/my-pending');
                if (response.ok) {
                    const invites = await response.json();
                    if (invites && invites.length > 0) {
                        // Redirect to onboarding page
                        // We assume the locale is the first part of the path
                        const locale = pathname?.split('/')[1] || 'ru';
                        router.push(`/${locale}/onboarding/invites`);
                    }
                }
            } catch (error) {
                console.error('Failed to check invitations:', error);
            } finally {
                setHasChecked(true);
            }
        };

        checkInvites();
    }, [pathname, router]);

    return null; // This component renders nothing
}
