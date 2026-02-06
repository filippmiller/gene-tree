'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

const translations = {
  en: {
    title: 'Stories failed to load',
    description: 'We couldn\'t load the stories page. Your stories are safe — please try again.',
    tryAgain: 'Retry',
    goHome: 'Dashboard',
  },
  ru: {
    title: 'Ошибка загрузки историй',
    description: 'Не удалось загрузить страницу историй. Ваши истории в безопасности — попробуйте снова.',
    tryAgain: 'Повторить',
    goHome: 'Главная',
  },
};

export default function StoriesError({
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
    console.error('[Stories] Error:', error);
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
