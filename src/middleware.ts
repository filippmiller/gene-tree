import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    if (session) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
    return res;
  }

  // Root redirect handled by page.tsx
  if (pathname === "/") {
    return res;
  }

  // Protected routes
  if (!session && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

