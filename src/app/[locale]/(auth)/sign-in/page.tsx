'use client';

import {useState} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback` }
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push(`/${locale}/app`);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="max-w-sm space-y-3">
        <p className="text-green-600">Check your email for a magic link.</p>
        <button 
          onClick={() => { setSent(false); setEmail(''); }}
          className="text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-3">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUsePassword(false)}
          className={`px-4 py-2 ${!usePassword ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Magic Link
        </button>
        <button
          onClick={() => setUsePassword(true)}
          className={`px-4 py-2 ${usePassword ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Password
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={usePassword ? handlePassword : handleMagicLink} className="space-y-3">
        <input 
          className="border p-2 w-full" 
          type="email" 
          value={email}
          onChange={(e)=>setEmail(e.target.value)} 
          placeholder="you@example.com"
          required
        />
        {usePassword && (
          <input 
            className="border p-2 w-full" 
            type="password" 
            value={password}
            onChange={(e)=>setPassword(e.target.value)} 
            placeholder="Password"
            required
          />
        )}
        <button 
          className="border p-2 w-full bg-blue-500 text-white disabled:bg-gray-400" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : usePassword ? 'Sign in' : 'Send Magic Link'}
        </button>
      </form>

      {!usePassword && (
        <p className="text-sm text-gray-600 mt-4">
          For testing: Use <strong>Password</strong> tab to login with email/password
        </p>
      )}
    </div>
  );
}
