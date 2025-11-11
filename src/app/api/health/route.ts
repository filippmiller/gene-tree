export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing supabaseAdmin public env' }), { status: 500 });
    }
    const res = await fetch(url.replace(/\/$/, '') + '/auth/v1/health', {
      headers: { apikey: anon, authorization: `Bearer ${anon}` },
      cache: 'no-store',
    });
    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

