import { recordVisit, recordMenuVisit, recordPageHit, type VisitKind } from "@/lib/visits";

export const runtime = "nodejs";

/** Herkese açık sayfa görüntülenmesini kaydeder (beacon ile çağrılır). */
export async function POST(req: Request) {
  let kind: VisitKind = "landing";
  let slug = "";
  let path = "";
  try {
    const body = JSON.parse(await req.text());
    if (body?.kind === "menu" || body?.kind === "landing") kind = body.kind;
    if (typeof body?.slug === "string") slug = body.slug.slice(0, 80);
    if (typeof body?.path === "string") path = body.path.slice(0, 300);
  } catch {
    // gövde yoksa/bozuksa landing say
  }
  // Yol yoksa kind/slug'dan türet.
  if (!path) path = kind === "menu" && slug ? `/m/${slug}` : "/";
  // Yönetim/panel/api yollarını sayma.
  const blocked =
    path.startsWith("/admin") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/api");

  try {
    await recordVisit(kind);
    if (kind === "menu" && slug) await recordMenuVisit(slug);
    if (!blocked) {
      const xff = req.headers.get("x-forwarded-for");
      const ip =
        (xff ? xff.split(",")[0].trim() : "") ||
        req.headers.get("x-real-ip") ||
        "bilinmiyor";
      const ua = req.headers.get("user-agent");
      await recordPageHit(ip, path, ua);
    }
  } catch {
    // sayaç hatası kullanıcıyı etkilemesin
  }
  return new Response(null, { status: 204 });
}
