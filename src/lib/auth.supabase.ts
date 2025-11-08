import { createClient } from '@/lib/supabase/client';

export async function signIn(email: string, password: string) {
  console.log('[AUTH] Creating Supabase client...');
  const supabase = createClient();
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
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
