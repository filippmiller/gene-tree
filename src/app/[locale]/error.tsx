'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

const translations = {
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. This might be due to an expired session or a temporary issue.',
    tryAgain: 'Try Again',
    clearSession: 'Clear Session & Retry',
    goHome: 'Go to Home',
  },
  ru: {
    title: 'Что-то пошло не так',
    description: 'Произошла непредвиденная ошибка. Это может быть связано с истёкшей сессией или временной проблемой.',
    tryAgain: 'Попробовать снова',
    clearSession: 'Очистить сессию и повторить',
    goHome: 'На главную',
  },
};

export default function GlobalError({
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
    console.error('Application error:', error);
  }, [error]);

  const handleClearSession = () => {
    if (typeof window !== 'undefined') {
      // Clear Supabase-related storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionStorage.removeItem(key);
        }
      }
    }
    reset();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="grain-overlay" />
      </div>

      <Card className="relative w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl animate-fade-in-up" elevation="floating">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />

        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-display font-medium">
            {t.title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {t.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            onClick={() => reset()}
            variant="default"
            className="w-full h-12"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.tryAgain}
          </Button>

          <Button
            onClick={handleClearSession}
            variant="outline"
            className="w-full h-12"
          >
            {t.clearSession}
          </Button>

          <Button
            onClick={() => window.location.href = `/${locale}/app`}
            variant="ghost"
            className="w-full h-12"
          >
            <Home className="mr-2 h-4 w-4" />
            {t.goHome}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
