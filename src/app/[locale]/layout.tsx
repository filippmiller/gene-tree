import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { AuthSessionGuard } from '@/components/auth/AuthSessionGuard';
import { routing } from '@/i18n/routing';

/**
 * Locale Layout - Root layout for all localized pages
 *
 * IMPORTANT: setRequestLocale must be called BEFORE any next-intl functions
 * to ensure the request context has the correct locale.
 *
 * URL locale is the single source of truth.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // CRITICAL: Set request locale BEFORE calling any next-intl functions
  // This ensures getMessages() uses the correct URL locale
  setRequestLocale(locale);

  // Now getMessages() will use the locale we just set
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthSessionGuard />
      {children}
    </NextIntlClientProvider>
  );
}
