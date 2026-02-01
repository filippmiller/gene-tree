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
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card className="relative w-full max-w-md shadow-xl border border-white/50 dark:border-white/10 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 animate-fade-in-up" elevation="floating">
        <CardHeader className="space-y-1 text-center pb-2">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">{t.welcomeBack}</CardTitle>
          <CardDescription className="text-base">
            {t.signInDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? t.hidePassword : t.showPassword}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="error">
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
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                  {t.orDivider}
                </span>
              </div>
            </div>

            <a
              href={`/${locale}/magic-link${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              {t.magicLink}
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
                className="text-primary hover:underline transition-colors"
                disabled={loading}
              >
                {t.forgotPassword}
              </button>

              <div className="text-muted-foreground">
                {t.noAccount}{' '}
                <a
                  href={`/${locale}/sign-up`}
                  className="text-primary hover:underline font-medium"
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
