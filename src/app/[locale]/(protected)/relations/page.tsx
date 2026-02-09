import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import RelationshipsListByDepth from '@/components/relationships/RelationshipsListByDepth';

export default async function RelationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-3 sm:px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Family Relationships</h1>
          <p className="text-sm text-muted-foreground">View and manage your family connections</p>
        </div>

        {/* Relationships by category with modern design */}
        <RelationshipsListByDepth currentUserId={user.id} />
      </main>
    </div>
  );
}
