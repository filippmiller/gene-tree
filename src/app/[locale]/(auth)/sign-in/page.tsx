'use client';

import {useState} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {signIn, resetPassword} from '@/lib/auth.supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.push(`/${locale}/app`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm space-y-3 mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handlePassword} className="space-y-3">
        <input 
          className="border p-2 w-full rounded" 
          type="email" 
          value={email}
          onChange={(e)=>setEmail(e.target.value)} 
          placeholder="you@example.com"
          required
        />
        <input 
          className="border p-2 w-full rounded" 
          type="password" 
          value={password}
          onChange={(e)=>setPassword(e.target.value)} 
          placeholder="Password (any for MVP)"
          required
        />
        <button 
          className="border p-2 w-full bg-blue-500 text-white rounded disabled:bg-gray-400" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Sign in'}
        </button>
      </form>

      <div className="text-sm text-gray-600 mt-4 space-y-2">
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={async ()=>{ try{ await resetPassword(email); alert('Password reset email sent if account exists.'); } catch(e:any){ alert(e.message||'Failed to send reset'); } }}
          disabled={!email}
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
