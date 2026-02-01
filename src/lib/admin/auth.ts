import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export interface AdminContext {
  authorized: true;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface UnauthorizedContext {
  authorized: false;
  reason: 'not_authenticated' | 'not_admin';
}

export type AdminAuthResult = AdminContext | UnauthorizedContext;

/**
 * Verify the current user is an admin
 * Use this at the start of every admin API route
 */
export async function requireAdminContext(): Promise<AdminAuthResult> {
  const supabase = await getSupabaseSSR();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, reason: 'not_authenticated' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single();

  if ((profile as { role?: string })?.role !== 'admin') {
    return { authorized: false, reason: 'not_admin' };
  }

  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email || '',
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin',
    }
  };
}
