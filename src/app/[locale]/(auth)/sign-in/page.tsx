'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { resetPassword } from '@/lib/auth.supabase';
export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sparkles, KeyRound } from 'lucide-react';

const translations = {
  en: {
    welcomeBack: 'Welcome Back',
    signInDescription: 'Sign in to your family tree account',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    enterEmailFirst: 'Please enter your email first',
    resetEmailSent: 'Password reset email sent! Check your inbox.',
    resetEmailFailed: 'Failed to send reset email',
    signInFailed: 'Failed to sign in',
    orDivider: 'or',
    magicLink: 'Sign in with magic link',
    noPasswordNeeded: 'No password needed',
  },
  ru: {
    welcomeBack: 'С возвращением',
    signInDescription: 'Войдите в свой аккаунт семейного древа',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    signIn: 'Войти',
    signingIn: 'Вход...',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    signUp: 'Регистрация',
    enterEmailFirst: 'Сначала введите email',
    resetEmailSent: 'Ссылка для сброса пароля отправлена! Проверьте почту.',
    resetEmailFailed: 'Не удалось отправить письмо для сброса',
    signInFailed: 'Не удалось войти',
    orDivider: 'или',
    magicLink: 'Войти по ссылке',
    noPasswordNeeded: 'Без пароля',
  },
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const t = translations[locale as keyof typeof translations] || translations.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Sync session with server
      if (data.session) {
        const syncResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });

        if (!syncResponse.ok) {
          throw new Error('Failed to sync session');
        }
      }

      router.push(`/${locale}/app`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t.signInFailed);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary golden glow */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        {/* Film grain overlay */}
        <div className="grain-overlay" />
        {/* Vignette */}
        <div className="vignette" />
      </div>

      {/* Top actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card
        className="relative w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl animate-fade-in-up"
        elevation="floating"
      >
        {/* Subtle top gradient border */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="space-y-1 text-center pb-2">
          {/* Logo */}
          <div className="mx-auto mb-4 relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-glow-lg">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/10 to-white/20" />
              <Sparkles className="h-8 w-8 text-primary-foreground relative z-10" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-medium text-gradient-gold">
            {t.welcomeBack}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {t.signInDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} data-testid="sign-in-form" className="space-y-5">
            <FloatingInput
              id="email"
              label={t.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />

            <div className="space-y-2">
              <FloatingInput
                id="password"
                label={t.passwordLabel}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? t.hidePassword : t.showPassword}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="error" data-testid="sign-in-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 text-base"
              loading={loading}
            >
              {loading ? t.signingIn : t.signIn}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  {t.orDivider}
                </span>
              </div>
            </div>

            <a
              href={`/${locale}/magic-link${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 text-sm font-medium group"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>{t.magicLink}</span>
              <span className="text-xs text-muted-foreground">({t.noPasswordNeeded})</span>
            </a>

            <div className="space-y-3 text-center text-sm mt-6">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError(t.enterEmailFirst);
                    return;
                  }
                  try {
                    await resetPassword(email);
                    setError('');
                    alert(t.resetEmailSent);
                  } catch (e: any) {
                    setError(e.message || t.resetEmailFailed);
                  }
                }}
                className="text-primary hover:text-primary/80 hover:underline transition-colors"
                disabled={loading}
              >
                {t.forgotPassword}
              </button>

              <div className="text-muted-foreground">
                {t.noAccount}{' '}
                <a
                  href={`/${locale}/sign-up`}
                  className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                >
                  {t.signUp}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
