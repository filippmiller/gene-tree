'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, KeyRound, ArrowRight, Shield } from 'lucide-react';

const translations = {
  en: {
    subtitle: 'SESSION EXPIRED',
    title: 'Time to',
    titleHighlight: 'Reconnect',
    description: 'Your session has timed out for security. Clear your session data and sign in again to continue where you left off.',
    clearAndRetry: 'Clear Session & Continue',
    goToSignIn: 'Sign In',
    security: 'Your data remains safe and secure',
  },
  ru: {
    subtitle: 'СЕССИЯ ИСТЕКЛА',
    title: 'Пора',
    titleHighlight: 'Переподключиться',
    description: 'Ваша сессия истекла в целях безопасности. Очистите данные сессии и войдите снова, чтобы продолжить.',
    clearAndRetry: 'Очистить и продолжить',
    goToSignIn: 'Войти',
    security: 'Ваши данные в безопасности',
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
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  const handleClearAndRetry = async () => {
    setIsClearing(true);
    if (typeof window !== 'undefined') {
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
    await new Promise(r => setTimeout(r, 500));
    reset();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#0a0a0c] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] bg-orange-600/6 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />

        {/* Radial gradient center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-full blur-[180px]" />

        {/* Film grain */}
        <div className="grain-overlay opacity-30" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg text-center space-y-8 animate-fade-in-up">
        {/* Decorative icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-3xl blur-xl" />
          <div className="relative w-full h-full bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 rounded-3xl border border-amber-500/20 flex items-center justify-center backdrop-blur-xl">
            <KeyRound className="w-10 h-10 text-amber-400/80" />
          </div>
          {/* Subtle glow ring */}
          <div className="absolute -inset-1 rounded-[26px] bg-gradient-to-r from-amber-500/20 via-transparent to-orange-500/20 opacity-50" />
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-[0.3em] text-amber-500/70 uppercase">
            {t.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white/90 tracking-tight">
            {t.title}{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent font-medium">
              {t.titleHighlight}
            </span>
          </h1>
          <p className="text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleClearAndRetry}
            disabled={isClearing}
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-medium text-base rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-300 hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            {isClearing ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5" />
            )}
            {t.clearAndRetry}
          </Button>

          <Button
            onClick={() => window.location.href = `/${locale}/sign-in`}
            variant="outline"
            className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-white font-medium text-base rounded-xl backdrop-blur-sm transition-all duration-300 group"
          >
            {t.goToSignIn}
            <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 pt-4 text-zinc-500">
          <Shield className="w-4 h-4 text-green-500/70" />
          <span className="text-xs">{t.security}</span>
        </div>
      </div>
    </div>
  );
}
