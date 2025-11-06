import createMiddleware from "next-intl/middleware";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ru", "en"],
  defaultLocale: "ru",
  localePrefix: "always",
});

export async function middleware(req: NextRequest) {
  // Сначала обрабатываем локали
  const response = intlMiddleware(req);
  
  const res = response || NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Определяем локаль из пути
  const locale = pathname.split("/")[1] || "ru";
  const isLocale = ["ru", "en"].includes(locale);
  const actualPath = isLocale ? pathname.slice(3) : pathname;

  // Public routes (auth pages)
  if (actualPath.startsWith("/sign-in") || actualPath.startsWith("/sign-up") || actualPath.startsWith("/auth/callback")) {
    if (session && !actualPath.startsWith("/auth/callback")) {
      return NextResponse.redirect(new URL(`/${locale}/app`, req.url));
    }
    return res;
  }

  // Root redirect handled by page.tsx
  if (pathname === "/" || pathname === `/${locale}`) {
    return res;
  }

  // Protected routes
  if (!session && !actualPath.startsWith("/sign-in") && !actualPath.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
