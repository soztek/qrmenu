import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isVeoConfigured, startVideoGeneration, VeoError, type RefImage } from "@/lib/veo";
import { MAX_REFERENCE_IMAGES, type VeoModelKey } from "@/lib/veo-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Bir Blob URL'ini indirip base64'e çevirir (referans görsel için). */
async function urlToRef(url: string): Promise<RefImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!IMAGE_TYPES.has(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 8 * 1024 * 1024) return null; // 8MB güvenlik sınırı
    return { base64: buf.toString("base64"), mimeType: type };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!isVeoConfigured()) {
    return NextResponse.json(
      { error: "Video üretimi şu an kapalı. Yönetici GEMINI_API_KEY eklemeli." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const prompt = String(form.get("prompt") ?? "").trim();
  if (prompt.length < 10) {
    return NextResponse.json({ error: "Prompt çok kısa." }, { status: 400 });
  }
  const modelKey: VeoModelKey = form.get("model") === "quality" ? "quality" : "fast";
  const aspectRatio = String(form.get("aspectRatio") ?? "9:16") || "9:16";

  // Referans görseller: seçili ürün foto URL'leri + yüklenen dosyalar (toplam max 3)
  const refs: RefImage[] = [];

  const imageUrlsRaw = String(form.get("imageUrls") ?? "");
  if (imageUrlsRaw) {
    let urls: string[] = [];
    try {
      urls = JSON.parse(imageUrlsRaw);
    } catch {
      urls = [];
    }
    for (const u of urls) {
      if (refs.length >= MAX_REFERENCE_IMAGES) break;
      if (typeof u === "string" && u.startsWith("http")) {
        const r = await urlToRef(u);
        if (r) refs.push(r);
      }
    }
  }

  for (const file of form.getAll("refImage")) {
    if (refs.length >= MAX_REFERENCE_IMAGES) break;
    if (file instanceof File && IMAGE_TYPES.has(file.type)) {
      if (file.size > 8 * 1024 * 1024) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      refs.push({ base64: buf.toString("base64"), mimeType: file.type });
    }
  }

  try {
    const operationId = await startVideoGeneration({
      prompt,
      model: modelKey,
      aspectRatio,
      referenceImages: refs,
    });
    return NextResponse.json({ operationId, referenceCount: refs.length });
  } catch (err) {
    const message = err instanceof VeoError ? err.message : "Video başlatılamadı.";
    const detail = err instanceof VeoError ? err.detail : undefined;
    return NextResponse.json(
      { error: message, detail: detail?.slice(0, 400) },
      { status: 502 },
    );
  }
}
