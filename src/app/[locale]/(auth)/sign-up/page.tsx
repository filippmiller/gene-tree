'use client';

import {useState} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();
  const supabase = createClient();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback` }
    });
    if (!error) setSent(true);
  };

  if (sent) return <p>Check your email for a magic link.</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <input className="border p-2 w-full" type="email" value={email}
             onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
      <button className="border p-2 w-full" type="submit">Sign up</button>
    </form>
  );
}
