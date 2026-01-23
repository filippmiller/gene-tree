import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import Nav from '@/components/Nav';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import InvitationChecker from '@/components/invitations/InvitationChecker';

/**
 * Protected Layout - Auth Guard
 *
 * Ensures all routes under (protected) require authentication.
 * Redirects to sign-in if no session is found.
 *
 * Features:
 * - Server-side auth check (secure)
 * - Top navigation bar
 * - Mobile bottom navigation
 * - Responsive layout with max-width
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

  return (
    <>
      <InvitationChecker />
      <Nav />
      <div className="max-w-7xl mx-auto w-full pb-20 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </>
  );
}
