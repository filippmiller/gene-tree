'use client';

import {useState} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {signIn, resetPassword} from '@/lib/auth.supabase';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('[SIGN-IN] Attempting sign in for:', email);
    try {
      console.log('[SIGN-IN] Calling signIn...');
      const user = await signIn(email, password);
      console.log('[SIGN-IN] Sign in successful! User:', user?.email);
      console.log('[SIGN-IN] Waiting for session to be established...');
      // Wait a moment for the session cookie to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[SIGN-IN] Redirecting to app...');
      // Use window.location to ensure cookies are sent with next request
      window.location.href = `/${locale}/app`;
    } catch (err: any) {
      console.error('[SIGN-IN] Sign in failed:', err);
      console.error('[SIGN-IN] Error message:', err.message);
      console.error('[SIGN-IN] Error details:', JSON.stringify(err, null, 2));
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute top-4 right-4 text-xs text-gray-500 font-mono">
        Build: {process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}
      </div>
      <Card className="w-full max-w-md shadow-2xl border-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <svg
              className="h-6 w-6 text-white"
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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your family tree account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="filippmiller@gmail.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="space-y-2 text-center text-sm">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Please enter your email first');
                    return;
                  }
                  try {
                    await resetPassword(email);
                    setError('');
                    alert('Password reset email sent! Check your inbox.');
                  } catch (e: any) {
                    setError(e.message || 'Failed to send reset email');
                  }
                }}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                Forgot password?
              </button>
              <div className="text-gray-600">
                Don't have an account?{' '}
                <a href={`/${locale}/sign-up`} className="text-blue-600 hover:underline">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
