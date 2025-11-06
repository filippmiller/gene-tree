'use client';

import {useEffect} from 'react';
import {useRouter, useParams, useSearchParams} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const {locale} = useParams<{locale: string}>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      // На случай OAuth PKCE:
      const code = searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      }

      const { data: { session } } = await supabase.auth.getSession();

      router.replace(`/${locale}/app`);
    };

    run();
  }, [router, locale, searchParams]);

  return <p>Signing you in…</p>;
}
