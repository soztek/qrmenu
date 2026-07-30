import { recordVisit, type VisitKind } from "@/lib/visits";

export const runtime = "nodejs";

/** Herkese açık sayfa görüntülenmesini kaydeder (beacon ile çağrılır). */
export async function POST(req: Request) {
  let kind: VisitKind = "landing";
  try {
    const body = JSON.parse(await req.text());
    if (body?.kind === "menu" || body?.kind === "landing") kind = body.kind;
  } catch {
    // gövde yoksa/bozuksa landing say
  }
  try {
    await recordVisit(kind);
  } catch {
    // sayaç hatası kullanıcıyı etkilemesin
  }
  return new Response(null, { status: 204 });
}
