import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Auth callback handler for:
 * - Magic link authentication (OTP via email)
 * - OAuth sign-in
 * - Password reset
 *
 * Supabase sends either:
 * - `code` parameter for PKCE flow (magic link, OAuth)
 * - `token_hash` + `type` for older email link flows
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/en/app';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Extract locale from the next parameter or default to 'en'
  const localeMatch = next.match(/^\/(en|ru)\//);
  const locale = localeMatch ? localeMatch[1] : 'en';

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    console.error('[AUTH-CALLBACK] Error:', error, errorDescription);
    const errorUrl = new URL(`/${locale}/sign-in`, requestUrl.origin);
    errorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Handle PKCE flow (code parameter) - used by magic links and OAuth
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      console.log('[AUTH-CALLBACK] Session established via PKCE code');
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error('[AUTH-CALLBACK] Code exchange failed:', exchangeError.message);
  }

  // Handle legacy token_hash flow (older magic links)
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'signup' | 'recovery' | 'magiclink',
    });

    if (!verifyError) {
      console.log('[AUTH-CALLBACK] Session established via token_hash');
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error('[AUTH-CALLBACK] Token verification failed:', verifyError.message);
  }

  // If no valid auth parameters or verification failed, redirect to sign-in
  console.log('[AUTH-CALLBACK] No valid auth parameters, redirecting to sign-in');
  return NextResponse.redirect(new URL(`/${locale}/sign-in`, requestUrl.origin));
}
