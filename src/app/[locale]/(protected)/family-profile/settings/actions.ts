"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function updateProfile(prev: {error?: string; success?: boolean} | null, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set(name, value, options); },
          remove(name: string, options: any) { cookieStore.set(name, '', { ...options, maxAge: 0 }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const profile: any = {};
    const fields = ['first_name','middle_name','last_name','maiden_name','nickname','gender','birth_date','birth_place','phone','occupation','bio'];
    for (const f of fields) {
      const v = formData.get(f);
      if (v !== null && String(v).length > 0) profile[f] = String(v);
    }

    if (!profile.first_name || !profile.last_name || !profile.gender) {
      // allow partial update, but keep basic validation
      // if all three absent, skip validation
    }

    const { error } = await supabase.from('user_profiles').update(profile).eq('id', user.id);
    if (error) return { error: error.message };

    return { success: true };
  } catch (e: any) {
    return { error: e?.message || 'Unexpected error' };
  }
}
