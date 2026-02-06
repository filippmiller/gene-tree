import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { authLogger } from '@/lib/logger';

/**
 * POST /api/auth/session
 * Sets the session cookie on the server after client-side sign-in
 * This syncs the auth state between browser and server
 */
export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json();
    
    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      );
    }
    
    const supabase = await getSupabaseSSR();
    
    // This sets the session cookie on the server
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (error) {
      authLogger.error({ error: error.message }, 'Failed to set session');
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    authLogger.info('Session cookie set successfully');
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    authLogger.error({ error: error.message || 'unknown' }, 'Auth session POST error');
    return NextResponse.json(
      { error: error.message || 'Failed to set session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on sign-out
 */
export async function DELETE() {
  try {
    const supabase = await getSupabaseSSR();
    await supabase.auth.signOut();
    authLogger.info('Session cleared');
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    authLogger.error({ error: error.message || 'unknown' }, 'Auth session sign-out error');
    return NextResponse.json(
      { error: error.message || 'Failed to sign out' },
      { status: 500 }
    );
  }
}
