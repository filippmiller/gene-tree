/**
 * Family Chat Page
 *
 * Full-page family group chat experience.
 */

import { getTranslations } from 'next-intl/server';
import { FamilyChat } from '@/components/family-chat';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'familyChat' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function FamilyChatPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] max-w-4xl py-4">
      <FamilyChat className="h-full rounded-lg border bg-card shadow-sm" />
    </div>
  );
}
