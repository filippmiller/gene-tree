import { getTranslations, setRequestLocale } from 'next-intl/server';
import AddRelativeForm from '@/components/relatives/AddRelativeForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'addRelative' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function AddRelativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Enable static rendering and set request locale
  setRequestLocale(locale);

  const t = await getTranslations('addRelative');

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('pageDescription')}
        </p>
      </div>

      <AddRelativeForm />
    </div>
  );
}
