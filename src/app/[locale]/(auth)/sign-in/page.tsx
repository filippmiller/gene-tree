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
import { TreePine, KeyRound } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      {/* Top actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card
        className="w-full max-w-sm bg-card/80 backdrop-blur-md border border-white/[0.08] animate-fade-in-up"
      >
        <CardHeader className="space-y-1 text-center pb-2">
          {/* Logo */}
          <div className="mx-auto mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#161B22] border border-[#30363D]">
              <TreePine className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-medium text-foreground">
            {t.welcomeBack}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {t.signInDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} data-testid="sign-in-form" className="space-y-4">
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
              className="w-full h-11 text-base bg-primary text-primary-foreground hover:bg-primary/90"
              loading={loading}
            >
              {loading ? t.signingIn : t.signIn}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#30363D]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  {t.orDivider}
                </span>
              </div>
            </div>

            <a
              href={`/${locale}/magic-link${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-colors text-sm font-medium group"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>{t.magicLink}</span>
              <span className="text-xs text-muted-foreground">({t.noPasswordNeeded})</span>
            </a>

            <div className="space-y-2 text-center text-sm mt-4">
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
