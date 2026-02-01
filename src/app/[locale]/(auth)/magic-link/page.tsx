'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { signInWithMagicLink } from '@/lib/auth.supabase';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const translations = {
  en: {
    title: 'Sign in with Email',
    description: 'No password needed. We\'ll send you a magic link.',
    emailLabel: 'Email Address',
    sendLink: 'Send Magic Link',
    sending: 'Sending...',
    checkEmail: 'Check your email!',
    checkEmailDescription: 'We sent a magic link to',
    clickLink: 'Click the link in the email to sign in. The link expires in 1 hour.',
    didntReceive: 'Didn\'t receive the email?',
    resend: 'Send again',
    backToSignIn: 'Sign in with password instead',
    noAccount: 'New here? No problem!',
    newUserNote: 'If you don\'t have an account, we\'ll create one automatically.',
    error: 'Something went wrong. Please try again.',
  },
  ru: {
    title: 'Вход по email',
    description: 'Без пароля. Мы отправим вам магическую ссылку.',
    emailLabel: 'Email',
    sendLink: 'Отправить ссылку',
    sending: 'Отправка...',
    checkEmail: 'Проверьте почту!',
    checkEmailDescription: 'Мы отправили магическую ссылку на',
    clickLink: 'Нажмите на ссылку в письме, чтобы войти. Ссылка действительна 1 час.',
    didntReceive: 'Не получили письмо?',
    resend: 'Отправить снова',
    backToSignIn: 'Войти с паролем',
    noAccount: 'Впервые здесь? Не проблема!',
    newUserNote: 'Если у вас нет аккаунта, мы создадим его автоматически.',
    error: 'Что-то пошло не так. Попробуйте ещё раз.',
  },
};

export default function MagicLinkPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Pre-fill email from query params (e.g., from invitation) - properly in useEffect
  const prefillEmail = searchParams.get('email');
  useEffect(() => {
    if (prefillEmail && !initialized) {
      setEmail(prefillEmail);
      setInitialized(true);
    }
  }, [prefillEmail, initialized]);

  // Get redirect destination from query params
  const redirectTo = searchParams.get('redirect') || `/${locale}/app`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithMagicLink(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        shouldCreateUser: true,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSent(false);
    setLoading(true);
    setError('');

    try {
      await signInWithMagicLink(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        shouldCreateUser: true,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
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
            {sent ? (
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            ) : (
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            )}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
            {sent ? t.checkEmail : t.title}
          </CardTitle>
          <CardDescription className="text-base">
            {sent ? (
              <>
                {t.checkEmailDescription} <strong>{email}</strong>
              </>
            ) : (
              t.description
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {sent ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {t.clickLink}
                </p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{t.didntReceive}</p>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  loading={loading}
                  className="w-full"
                >
                  {loading ? t.sending : t.resend}
                </Button>
              </div>

              {error && (
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
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
                autoFocus
              />

              <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                <p className="text-xs text-muted-foreground">
                  {t.newUserNote}
                </p>
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
                {loading ? t.sending : t.sendLink}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <a
                  href={`/${locale}/sign-in`}
                  className="text-primary hover:underline font-medium"
                >
                  {t.backToSignIn}
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
