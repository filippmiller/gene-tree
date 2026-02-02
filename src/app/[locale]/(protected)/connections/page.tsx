import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { ConnectionsPageClient } from './ConnectionsPageClient';

interface ConnectionsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ConnectionsPage({ params }: ConnectionsPageProps) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  return <ConnectionsPageClient userId={user.id} />;
}
