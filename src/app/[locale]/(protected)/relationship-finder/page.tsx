import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import RelationshipPathFinder from '@/components/relationship-path/RelationshipPathFinder';

export default async function RelationshipFinderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'relationshipPath' });
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Get all family members the user can see
  const { data: familyMembers } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .order('first_name');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <main className="w-full px-4 sm:px-6 lg:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('description')}</p>
          </div>

          <RelationshipPathFinder
            familyMembers={familyMembers || []}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
