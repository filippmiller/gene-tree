import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Try a lightweight count query
    const { count, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true, count: count ?? 0 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

