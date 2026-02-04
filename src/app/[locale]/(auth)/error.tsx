'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

const translations = {
  en: {
    title: 'Session Error',
    description: 'Your session has expired or is invalid. Please clear your browser data and try again.',
    clearAndRetry: 'Clear & Retry',
    goToSignIn: 'Go to Sign In',
  },
  ru: {
    title: 'Ошибка сессии',
    description: 'Ваша сессия истекла или недействительна. Очистите данные браузера и попробуйте снова.',
    clearAndRetry: 'Очистить и повторить',
    goToSignIn: 'Перейти к входу',
  },
};

export default function AuthError({
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
    // Log error for debugging
    console.error('Auth error:', error);
  }, [error]);

  const handleClearAndRetry = () => {
    // Clear Supabase-related localStorage items
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Also clear session storage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionStorage.removeItem(key);
        }
      }
    }

    // Reset the error boundary
    reset();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <Card className="relative w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl" elevation="floating">
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

        <CardContent className="space-y-4">
          <Button
            onClick={handleClearAndRetry}
            variant="default"
            className="w-full h-12"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.clearAndRetry}
          </Button>

          <Button
            onClick={() => window.location.href = `/${locale}/sign-in`}
            variant="outline"
            className="w-full h-12"
          >
            {t.goToSignIn}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
