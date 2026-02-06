'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

const translations = {
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred while loading this page. Your data is safe — this is a display issue.',
    tryAgain: 'Try Again',
    goHome: 'Go to Dashboard',
    errorId: 'Error ID',
  },
  ru: {
    title: 'Что-то пошло не так',
    description: 'Произошла непредвиденная ошибка при загрузке страницы. Ваши данные в безопасности — это проблема отображения.',
    tryAgain: 'Попробовать снова',
    goHome: 'На главную',
    errorId: 'ID ошибки',
  },
};

export default function ProtectedError({
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
    console.error('[ProtectedRoute] Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md border-destructive/20">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              {t.errorId}: {error.digest}
            </p>
          )}

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
