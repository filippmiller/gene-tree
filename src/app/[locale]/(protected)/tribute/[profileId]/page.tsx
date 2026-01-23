import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { redirect, notFound } from 'next/navigation';
import TributePageLayout from '@/components/tribute/TributePageLayout';
import Link from 'next/link';

export default async function TributePage({
  params,
}: {
  params: Promise<{ locale: string; profileId: string }>;
}) {
  const { locale, profileId } = await params;
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Check if the profile exists and is deceased with tribute mode enabled
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, is_living, tribute_mode_enabled')
    .eq('id', profileId)
    .single() as { data: { id: string; first_name: string; last_name: string; is_living: boolean; tribute_mode_enabled: boolean } | null };

  if (!profile) {
    notFound();
  }

  // Only show tribute page for deceased members with tribute mode enabled
  if (profile.is_living !== false || !profile.tribute_mode_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <main className="w-full px-4 sm:px-6 lg:px-12 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="text-6xl mb-6">🕊️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tribute Page Not Available
            </h1>
            <p className="text-gray-600 mb-8">
              This tribute page is not available. Tribute pages are only enabled for
              deceased family members when a family admin enables tribute mode.
            </p>
            <Link
              href={`/${locale}/profile/${profileId}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Profile Instead
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
      <main className="w-full px-4 sm:px-6 lg:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <TributePageLayout profileId={profileId} />
        </div>
      </main>
    </div>
  );
}
