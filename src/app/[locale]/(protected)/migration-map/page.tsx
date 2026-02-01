/**
 * Migration Map Page
 *
 * Full-page view of the family migration visualization.
 * Shows animated paths of how the family migrated across geography.
 */

import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { extractMigrationData } from '@/lib/migration/data-extractor';
import MigrationMapClient from './MigrationMapClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function MigrationMapPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Extract migration data
  const migrationData = await extractMigrationData(supabase, user.id);

  // Labels for the page
  const labels = {
    en: {
      title: 'Migration Map',
      description: 'Visualize your family\'s journey across the world',
      back: 'Back to Dashboard',
    },
    ru: {
      title: 'Карта миграции',
      description: 'Визуализация пути вашей семьи по миру',
      back: 'Назад к панели',
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.description}
              </p>
            </div>
            <a
              href={`/${locale}/app`}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              {t.back}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MigrationMapClient initialData={migrationData} locale={locale} />
      </main>
    </div>
  );
}
