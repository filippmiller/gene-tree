import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { AppShell } from '@/components/layout';
import InvitationChecker from '@/components/invitations/InvitationChecker';
import PostAuthHandler from '@/components/auth/PostAuthHandler';
import OnboardingChecker from '@/components/onboarding/OnboardingChecker';
import { PresenceInitializer } from '@/components/presence';

/**
 * Protected Layout - Auth Guard
 *
 * Ensures all routes under (protected) require authentication.
 * Redirects to sign-in if no session is found.
 *
 * Features:
 * - Server-side auth check (secure)
 * - Onboarding redirect for new users
 * - Bitrix24-style sidebar navigation
 * - Responsive layout with collapsible sidebar
 */
export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  // Use getUser() - verifies token with Supabase Auth server (secure)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single() as { data: { onboarding_completed?: boolean } | null };

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <>
      <PostAuthHandler />
      <InvitationChecker />
      <OnboardingChecker onboardingCompleted={onboardingCompleted} />
      <PresenceInitializer initialUserId={user.id} />
      <AppShell>
        {children}
      </AppShell>
    </>
  );
}
