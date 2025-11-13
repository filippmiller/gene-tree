import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';
import {AuthSessionGuard} from '@/components/auth/AuthSessionGuard';

const locales = ['ru','en'] as const;

export default async function LocaleLayout({
  children, params
}:{children: ReactNode; params: Promise<{locale: string}>}) {
  const { locale: resolvedLocale } = await params;
  if (!locales.includes(resolvedLocale as any)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthSessionGuard />
      {children}
    </NextIntlClientProvider>
  );
}
