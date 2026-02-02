'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';

interface Props {
  onboardingCompleted: boolean;
}

/**
 * OnboardingChecker - Redirects users to onboarding wizard if not completed
 *
 * This component checks if the current user has completed onboarding
 * and redirects them to the wizard if not. It excludes the wizard page itself
 * from the redirect to prevent an infinite loop.
 */
export default function OnboardingChecker({ onboardingCompleted }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  useEffect(() => {
    // Skip if onboarding is already completed
    if (onboardingCompleted) return;

    // Skip if already on the wizard page
    if (pathname?.includes('/onboarding/wizard')) return;

    // Skip if on the invites page (might need to accept invites first)
    if (pathname?.includes('/onboarding/invites')) return;

    // Redirect to onboarding wizard
    router.push(`/${locale}/onboarding/wizard`);
  }, [onboardingCompleted, pathname, locale, router]);

  return null;
}
