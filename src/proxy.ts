import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16: middleware yerine `proxy`.
 * 1) Özel alan adı (işletmenin kendi domaini) → işletme menüsünü kök adreste gösterir.
 * 2) Korunan sayfalarda oturum cookie'sinin varlığını kontrol eder (tam doğrulama
 *    dashboard layout'unda getCurrentUser ile yapılır).
 */

/** Platformun kendi ana host'ları — bunlar dışındaki her host özel domain sayılır. */
function isPlatformHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return (
    h === "soztekqrmenu.com.tr" ||
    h === "www.soztekqrmenu.com.tr" ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".vercel.app")
  );
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // ── 1) Özel alan adı: tüm sayfa yollarını işletme menüsüne yönlendir (rewrite) ──
  // /api ve statik dosyalar matcher'da hariç tutulur; buraya sadece sayfa yolları gelir.
  if (host && !isPlatformHost(host)) {
    const hostname = host.split(":")[0].toLowerCase();
    const url = request.nextUrl.clone();
    url.pathname = `/m/${hostname}`; // [slug] = host; sayfa customDomain ile gerçek slug'a çözer
    const headers = new Headers(request.headers);
    headers.set("x-tenant-host", hostname);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // ── 2) Platform host: korunan sayfalarda oturum kontrolü ──
  const hasSession = Boolean(request.cookies.get("session")?.value);
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
  // Tüm sayfa yolları (api, _next ve uzantılı statik dosyalar hariç).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
