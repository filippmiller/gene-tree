'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home, Sparkles, ArrowRight } from 'lucide-react';

const translations = {
  en: {
    subtitle: 'UNEXPECTED INTERRUPTION',
    title: 'A Momentary',
    titleHighlight: 'Pause',
    description: 'Something unexpected happened. This could be a session timeout or a temporary hiccup in the archive.',
    tryAgain: 'Try Again',
    clearSession: 'Clear Session & Retry',
    goHome: 'Return to Archive',
    tip: 'Tip: Clearing your session often resolves persistent issues',
  },
  ru: {
    subtitle: 'НЕПРЕДВИДЕННАЯ ПАУЗА',
    title: 'Временная',
    titleHighlight: 'Остановка',
    description: 'Произошло что-то неожиданное. Возможно, истекла сессия или возникла временная проблема в архиве.',
    tryAgain: 'Попробовать снова',
    clearSession: 'Очистить сессию',
    goHome: 'Вернуться в архив',
    tip: 'Совет: очистка сессии часто решает постоянные проблемы',
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
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const handleClearSession = async () => {
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
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#D29922]/8 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#D29922]/6 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D29922]/4 rounded-full blur-[200px]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Film grain */}
        <div className="grain-overlay opacity-40" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg text-center space-y-8 animate-fade-in-up">
        {/* Decorative icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-[#D29922]/15 rounded-3xl blur-xl" />
          <div className="relative w-full h-full bg-card/80 backdrop-blur-md border border-white/[0.08] rounded-3xl flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-[#D29922]/80" />
          </div>
          {/* Animated ring */}
          <div className="absolute -inset-2 rounded-[28px] border border-[#D29922]/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-[0.3em] text-[#D29922]/70 uppercase">
            {t.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white/90 tracking-tight">
            {t.title}{' '}
            <span className="text-[#D29922] font-medium">
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
            onClick={() => reset()}
            className="w-full h-14 bg-[#D29922] hover:bg-[#E0A830] text-black font-medium text-base rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {t.tryAgain}
          </Button>

          <Button
            onClick={handleClearSession}
            disabled={isClearing}
            variant="outline"
            className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#D29922]/30 text-white font-medium text-base rounded-xl backdrop-blur-sm transition-all duration-300"
          >
            {isClearing ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 text-[#D29922]" />
            )}
            {t.clearSession}
          </Button>

          <Button
            onClick={() => window.location.href = `/${locale}/app`}
            variant="ghost"
            className="w-full h-12 text-zinc-400 hover:text-white hover:bg-transparent group"
          >
            <Home className="mr-2 h-4 w-4" />
            {t.goHome}
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </div>

        {/* Tip */}
        <p className="text-xs text-zinc-500 pt-4">
          {t.tip}
        </p>
      </div>
    </div>
  );
}
