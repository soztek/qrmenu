import { recordVisit, recordMenuVisit, type VisitKind } from "@/lib/visits";

export const runtime = "nodejs";

/** Herkese açık sayfa görüntülenmesini kaydeder (beacon ile çağrılır). */
export async function POST(req: Request) {
  let kind: VisitKind = "landing";
  let slug = "";
  try {
    const body = JSON.parse(await req.text());
    if (body?.kind === "menu" || body?.kind === "landing") kind = body.kind;
    if (typeof body?.slug === "string") slug = body.slug.slice(0, 80);
  } catch {
    // gövde yoksa/bozuksa landing say
  }
  try {
    await recordVisit(kind);
    if (kind === "menu" && slug) await recordMenuVisit(slug);
  } catch {
    // sayaç hatası kullanıcıyı etkilemesin
  }
  return new Response(null, { status: 204 });
}
