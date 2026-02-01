import { getSupabaseBrowser } from '@/lib/supabase/browser';

/**
 * Send a magic link to the user's email for passwordless authentication.
 * Works for both new and existing users.
 */
export async function signInWithMagicLink(
  email: string,
  options?: {
    redirectTo?: string;
    shouldCreateUser?: boolean;
  }
) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
      shouldCreateUser: options?.shouldCreateUser ?? true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
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
