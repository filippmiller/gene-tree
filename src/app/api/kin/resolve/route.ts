import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);
  
  try {
    const body = await req.json();
    const { egoId, phrase } = body as { egoId: string; phrase: string };

    if (!egoId || !phrase) {
      await logAudit({
        action: 'kin_resolve_invalid_params',
        method: 'POST',
        path: '/api/kin/resolve',
        requestBody: body,
        responseStatus: 400,
        errorMessage: 'egoId and phrase are required',
        ...requestMeta,
      });
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
    if (!user) {
      await logAudit({
        action: 'kin_resolve_unauthorized',
        method: 'POST',
        path: '/api/kin/resolve',
        requestBody: body,
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('kin_resolve_ru', { p_start: egoId, p_phrase: phrase });
    
    if (error) {
      await logAudit({
        action: 'kin_resolve_error',
        method: 'POST',
        path: '/api/kin/resolve',
        requestBody: body,
        responseStatus: 400,
        errorMessage: error.message,
        errorStack: JSON.stringify(error),
        ...requestMeta,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAudit({
      action: 'kin_resolve_success',
      method: 'POST',
      path: '/api/kin/resolve',
      requestBody: body,
      responseStatus: 200,
      responseBody: { resultsCount: data?.length || 0 },
      ...requestMeta,
    });

    return NextResponse.json({ results: data });
  } catch (err: any) {
    await logAudit({
      action: 'kin_resolve_exception',
      method: 'POST',
      path: '/api/kin/resolve',
      responseStatus: 500,
      errorMessage: err.message,
      errorStack: err.stack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
