import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import RelationshipsListByDepth from '@/components/relationships/RelationshipsListByDepth';

export default async function RelationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Family Relationships</h1>
          <p className="text-muted-foreground">View and manage your family connections</p>
        </div>

        {/* Relationships by category with modern design */}
        <RelationshipsListByDepth currentUserId={user.id} />
      </main>
    </div>
  );
}
