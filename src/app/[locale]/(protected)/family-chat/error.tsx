'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

const translations = {
  en: {
    title: 'Chat failed to load',
    description: 'The family chat encountered a connection issue. Your messages are safe.',
    tryAgain: 'Reconnect',
    goHome: 'Dashboard',
  },
  ru: {
    title: 'Ошибка загрузки чата',
    description: 'Семейный чат столкнулся с проблемой соединения. Ваши сообщения в безопасности.',
    tryAgain: 'Переподключиться',
    goHome: 'Главная',
  },
};

export default function FamilyChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    console.error('[FamilyChat] Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
          <div className="flex gap-3 pt-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.tryAgain}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `/${locale}/app`}
            >
              <Home className="mr-2 h-4 w-4" />
              {t.goHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
