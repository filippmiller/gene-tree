import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { egoId, phrase } = body as { egoId: string; phrase: string };

  if (!egoId || !phrase) {
    return NextResponse.json({ error: 'egoId and phrase are required' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); }
      }
    }
  );

  // Кто делает запрос — читаем сессию (для RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('kin_resolve_ru', { p_start: egoId, p_phrase: phrase });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ results: data });
}
