import { PostgrestError } from '@supabase/supabase-js';

/**
 * Check if error is auth-related (session expired, unauthorized)
 */
export function isAuthError(error: PostgrestError | Error | null): boolean {
  if (!error) return false;
  
  // PostgrestError with auth-related codes
  if ('code' in error) {
    // PGRST301 = JWT expired or invalid
    // 42501 = insufficient_privilege (common RLS error)
    return error.code === 'PGRST301' || error.message?.includes('JWT');
  }
  
  // Generic error messages
  return (
    error.message?.includes('JWT') ||
    error.message?.includes('session') ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('not authenticated')
  );
}

/**
 * Handle Supabase errors with appropriate user feedback
 * Returns true if error was handled (e.g. redirect), false otherwise
 */
export function handleSupabaseError(
  error: PostgrestError | Error | null,
  context?: string
): boolean {
  if (!error) return false;

  console.error(`[Supabase Error]${context ? ` ${context}:` : ''}`, error);

  // Auth errors - redirect to login
  if (isAuthError(error)) {
    console.warn('[Supabase] Auth error detected, session likely expired');
    
    if (typeof window !== 'undefined') {
      // Show message and redirect
      alert('Your session has expired. Please login again.');
      window.location.href = '/en/sign-in';
    }
    
    return true; // Error was handled
  }

  return false; // Error was not handled, caller should handle it
}

/**
 * Wrapper for Supabase queries with automatic error handling
 * 
 * Usage:
 *   const result = await withErrorHandling(
 *     supabase.from('table').select(),
 *     'Fetching table data'
 *   );
 */
export async function withErrorHandling<T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const result = await queryPromise;
  
  if (result.error) {
    handleSupabaseError(result.error, context);
  }
  
  return result;
}
