import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import Nav from '@/components/Nav';

import InvitationChecker from '@/components/invitations/InvitationChecker';

/**
 * Protected Layout - Auth Guard
 * 
 * Ensures all routes under (protected) require authentication.
 * Redirects to sign-in if no session is found.
 * 
 * This runs on the server only, preventing hydration mismatches.
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

  // Use getSession() - reads from cookies directly, no API call
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.log('[PROTECTED-LAYOUT] No session, redirecting to sign-in');
    redirect(`/${locale}/sign-in`);
  }

  console.log('[PROTECTED-LAYOUT] Session valid, user:', session.user.email);

  return (
    <>
      <InvitationChecker />
      <Nav />
      <div className="max-w-7xl mx-auto w-full">
        {children}
      </div>
    </>
  );
}

