/**
 * Find Relatives Page
 *
 * Allows users to discover potential relatives who share common ancestors.
 * Features:
 * - Algorithmic matching based on shared ancestors
 * - Privacy-conscious connection requests
 * - Display of relationship descriptions (e.g., "Second cousin via Great-Grandmother Sarah")
 */

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { RelativeFinderClient } from '@/components/relative-finder';

interface FindRelativesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FindRelativesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'relativeFinder' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function FindRelativesPage({ params }: FindRelativesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'relativeFinder' });

  // Get authenticated user
  const supabase = await getSupabaseSSR();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <RelativeFinderClient
        userId={user.id}
        locale={locale as 'en' | 'ru'}
      />
    </div>
  );
}
