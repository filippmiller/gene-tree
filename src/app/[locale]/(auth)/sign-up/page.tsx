'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { signUp } from '@/lib/auth.supabase';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const translations = {
  en: {
    createAccount: 'Create Account',
    description: 'Start building your family tree today',
    nameLabel: 'Name (optional)',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    showPasswords: 'Show passwords',
    hidePasswords: 'Hide passwords',
    creating: 'Creating account...',
    create: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordsMatch: 'Passwords match',
    passwordTooShort: 'Password must be at least 6 characters long',
    accountCreated: 'Account created! Please check your email to confirm your account.',
    createFailed: 'Failed to create account',
    passwordStrength: 'Password strength',
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  },
  ru: {
    createAccount: 'Создать аккаунт',
    description: 'Начните строить своё семейное древо сегодня',
    nameLabel: 'Имя (необязательно)',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    confirmPasswordLabel: 'Подтвердите пароль',
    showPasswords: 'Показать пароли',
    hidePasswords: 'Скрыть пароли',
    creating: 'Создание аккаунта...',
    create: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signIn: 'Войти',
    passwordsDoNotMatch: 'Пароли не совпадают',
    passwordsMatch: 'Пароли совпадают',
    passwordTooShort: 'Пароль должен быть не менее 6 символов',
    accountCreated: 'Аккаунт создан! Проверьте почту для подтверждения.',
    createFailed: 'Не удалось создать аккаунт',
    passwordStrength: 'Надёжность пароля',
    weak: 'Слабый',
    fair: 'Средний',
    good: 'Хороший',
    strong: 'Надёжный',
  },
};

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { locale } = useParams<{ locale: string }>();
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Password strength calculator
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

    if (score < 30) return { score, label: t.weak, color: 'error' };
    if (score < 60) return { score, label: t.fair, color: 'warning' };
    if (score < 80) return { score, label: t.good, color: 'default' };
    return { score, label: t.strong, color: 'success' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, name || undefined);
      setSuccess(t.accountCreated);
      setError('');
    } catch (err: any) {
      setError(err.message || t.createFailed);
      setSuccess('');
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">{t.createAccount}</CardTitle>
          <CardDescription className="text-base">
            {t.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <FloatingInput
              id="name"
              label={t.nameLabel}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />

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

            <div className="space-y-3">
              <FloatingInput
                id="password"
                label={t.passwordLabel}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <Progress
                    value={passwordStrength.score}
                    variant={passwordStrength.color as any}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.passwordStrength}:{' '}
                    <span className={`font-medium ${
                      passwordStrength.color === 'error' ? 'text-destructive' :
                      passwordStrength.color === 'warning' ? 'text-amber-600' :
                      passwordStrength.color === 'success' ? 'text-emerald-600' :
                      'text-foreground'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <FloatingInput
              id="confirmPassword"
              label={t.confirmPasswordLabel}
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              error={confirmPassword && password !== confirmPassword ? t.passwordsDoNotMatch : undefined}
              success={confirmPassword && password === confirmPassword && confirmPassword.length >= 6 ? t.passwordsMatch : undefined}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? t.hidePasswords : t.showPasswords}
              </button>
            </div>

            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12 text-base"
              loading={loading}
              disabled={success !== ''}
            >
              {loading ? t.creating : t.create}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t.alreadyHaveAccount}{' '}
              <a
                href={`/${locale}/sign-in`}
                className="text-primary hover:underline font-medium"
              >
                {t.signIn}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
