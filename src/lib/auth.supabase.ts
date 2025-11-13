import { getSupabaseBrowser } from '@/lib/supabase/browser';

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  console.log('[AUTH] Attempting signInWithPassword...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('[AUTH] Response received:', { hasData: !!data, hasError: !!error });
  if (error) {
    console.error('[AUTH] Supabase error:', error);
    throw new Error(error.message);
  }
  console.log('[AUTH] User signed in:', data.user?.email);
  return data.user;
}

export async function signUp(email: string, password: string, name?: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
