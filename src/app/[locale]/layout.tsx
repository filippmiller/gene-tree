import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';
import Nav from '@/components/Nav';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const locales = ['ru','en'] as const;

export default async function LocaleLayout({
  children, params: {locale}
}:{children: ReactNode; params: {locale: string}}) {
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <div className="p-4">
            <LanguageSwitcher />
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
