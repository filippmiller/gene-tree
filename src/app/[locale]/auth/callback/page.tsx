'use client';

import {useEffect} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      // На случай OAuth PKCE:
      await supabase.auth.exchangeCodeForSession().catch(() => {});

      const { data: { session } } = await supabase.auth.getSession();

      router.replace(`/${locale}/app`);
    };

    run();
  }, [router, locale]);

  return <p>Signing you in…</p>;
}
