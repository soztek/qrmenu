import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Aynı-origin görsel proxy'si — dijital ekran videosunda canvas'ın cross-origin
 * görsellerle "tainted" olmasını (video export'u bozmasını) önler.
 * SSRF koruması: yalnızca Vercel Blob görselleri.
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return new NextResponse("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (
    target.protocol !== "https:" ||
    !target.hostname.endsWith(".public.blob.vercel-storage.com")
  ) {
    return new NextResponse("forbidden", { status: 403 });
  }

  try {
    const res = await fetch(target.toString());
    if (!res.ok) return new NextResponse("not found", { status: 404 });
    const ct = res.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) return new NextResponse("not image", { status: 415 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: { "content-type": ct, "cache-control": "public, max-age=86400" },
    });
  } catch {
    return new NextResponse("error", { status: 502 });
  }
}
