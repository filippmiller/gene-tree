import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

function naiveResolveRu(phrase: string) {
  const p = phrase.trim().toLowerCase();
  const out: Array<{ person_id: string; path_expr: string; name_ru: string }> = [];
  const has = (re: RegExp) => re.test(p);

  // Direct
  if (has(/\bмама\b|\bмать\b/)) out.push({ person_id: '', path_expr: 'P', name_ru: 'мама' });
  if (has(/\bпапа\b|\bотец\b/)) out.push({ person_id: '', path_expr: 'P', name_ru: 'папа' });
  if (has(/\bсын\b/)) out.push({ person_id: '', path_expr: 'C', name_ru: 'сын' });
  if (has(/\bдоч(ь|ка)\b/)) out.push({ person_id: '', path_expr: 'C', name_ru: 'дочь' });

  // Sibling
  if (has(/сестр/)) out.push({ person_id: '', path_expr: 'S', name_ru: 'сестра' });
  if (has(/\bбрат\b/)) out.push({ person_id: '', path_expr: 'S', name_ru: 'брат' });

  // Aunt/Uncle (sibling of parent)
  if (has(/сестра\s+(отца|папы|матери|мамы)/)) out.push({ person_id: '', path_expr: 'P.S', name_ru: 'тётя' });
  if (has(/брат\s+(отца|папы|матери|мамы)/)) out.push({ person_id: '', path_expr: 'P.S', name_ru: 'дядя' });

  // Grand*
  if (has(/\bбабушк/)) out.push({ person_id: '', path_expr: 'P.P', name_ru: 'бабушка' });
  if (has(/\bдед(ушка)?\b/)) out.push({ person_id: '', path_expr: 'P.P', name_ru: 'дедушка' });

  // Cousins (simple heuristics)
  if (has(/двоюродн.*брат/)) out.push({ person_id: '', path_expr: 'cousin', name_ru: 'двоюродный брат' });
  if (has(/двоюродн.*сестр/)) out.push({ person_id: '', path_expr: 'cousin', name_ru: 'двоюродная сестра' });

  return out;
}

export async function POST(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);
  
  try {
    const body = await req.json();
    const { egoId, phrase } = body as { egoId?: string; phrase?: string };

    // Validate phrase only; egoId is optional and defaults to current user
    if (!phrase || String(phrase).trim().length < 2) {
      await logAudit({
        action: 'kin_resolve_invalid_params',
        method: 'POST',
        path: '/api/kin/resolve',
        requestBody: body,
        responseStatus: 400,
        errorMessage: 'phrase is required',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'phrase is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
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
      // Allow unauthenticated fallback for simple phrase resolution
      const fallback = naiveResolveRu(String(phrase));
      await logAudit({
        action: 'kin_resolve_guest',
        method: 'POST',
        path: '/api/kin/resolve',
        requestBody: body,
        responseStatus: 200,
        responseBody: { resultsCount: fallback.length },
        ...requestMeta,
      });
      return NextResponse.json({ results: fallback });
    }

    const startId = egoId || user.id;
    const { data, error } = await supabase.rpc('kin_resolve_ru', { p_start: startId, p_phrase: String(phrase).trim() });
    
    let results = data as any[] | null;

    // Fallback to naive resolver on error or empty results
    if (error || !results || results.length === 0) {
      const fallback = naiveResolveRu(String(phrase));
      if (fallback.length > 0) {
        results = fallback;
      }
    }

    await logAudit({
      action: 'kin_resolve_success',
      method: 'POST',
      path: '/api/kin/resolve',
      requestBody: body,
      responseStatus: 200,
      responseBody: { resultsCount: (results?.length || 0) },
      ...requestMeta,
    });

    return NextResponse.json({ results: results || [] });
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
