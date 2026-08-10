import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16: middleware yerine `proxy`.
 * Hafif kontrol — sadece oturum cookie'sinin varlığına bakar; tam doğrulama
 * dashboard layout'unda (getCurrentUser) yapılır.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("session")?.value);
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/yazdir") ||
    pathname.startsWith("/qr-yazdir") ||
    pathname.startsWith("/mutfak-fis");
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/yazdir", "/qr-yazdir", "/mutfak-fis/:path*"],
};
