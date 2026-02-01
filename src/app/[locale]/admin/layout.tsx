import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { AdminLayout } from '@/components/admin';

export default async function AdminRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Verify admin access server-side
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { role: string | null; first_name: string | null; last_name: string | null } | null };

  if (profile?.role !== 'admin') {
    redirect(`/${locale}/app`);
  }

  const adminName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Admin';

  return (
    <AdminLayout adminName={adminName}>
      {children}
    </AdminLayout>
  );
}
