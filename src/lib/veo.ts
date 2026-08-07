import "server-only";
import { GoogleGenAI } from "@google/genai";
import { veoModelId, type VeoModelKey, MAX_REFERENCE_IMAGES } from "./veo-prompt";

/**
 * Veo 3.1 video üretimi — Google Gemini API (server-side).
 * GEMINI_API_KEY yalnızca sunucuda okunur; asla frontend'e gitmez.
 */

export class VeoError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.detail = detail;
  }
}

export function isVeoConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new VeoError("Video üretimi yapılandırılmamış (GEMINI_API_KEY yok).");
  return new GoogleGenAI({ apiKey });
}

/** Google API hatalarını kullanıcı dostu mesaja çevirir. */
function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const low = msg.toLowerCase();
  if (low.includes("429") || low.includes("quota") || low.includes("rate")) {
    return "Google video servisinde kota/limit doldu. Lütfen biraz sonra tekrar deneyin.";
  }
  if (low.includes("401") || low.includes("api key") || low.includes("permission") || low.includes("403")) {
    return "Google API anahtarı geçersiz veya yetkisiz. Yönetici ayarlarını kontrol etmeli.";
  }
  if (low.includes("safety") || low.includes("blocked")) {
    return "İçerik güvenlik filtresine takıldı. Prompt'u yumuşatıp tekrar deneyin.";
  }
  return "Video üretiminde bir hata oluştu. Lütfen tekrar deneyin.";
}

export interface RefImage {
  base64: string;
  mimeType: string;
}

/** Video üretimini başlatır → long-running operation adı (id) döner. */
export async function startVideoGeneration(opts: {
  prompt: string;
  model: VeoModelKey;
  aspectRatio: string;
  referenceImages: RefImage[];
}): Promise<string> {
  try {
    const ai = client();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { numberOfVideos: 1, aspectRatio: opts.aspectRatio };
    const refs = opts.referenceImages.slice(0, MAX_REFERENCE_IMAGES);
    if (refs.length) {
      config.referenceImages = refs.map((r) => ({
        image: { imageBytes: r.base64, mimeType: r.mimeType },
        referenceType: "ASSET",
      }));
    }
    const operation = await ai.models.generateVideos({
      model: veoModelId(opts.model),
      prompt: opts.prompt,
      config,
    });
    if (!operation?.name) {
      throw new VeoError("Video işlemi başlatılamadı.");
    }
    return operation.name;
  } catch (err) {
    console.error("Veo generate hata:", err);
    if (err instanceof VeoError) throw err;
    const raw = err instanceof Error ? err.message : String(err);
    throw new VeoError(friendly(err), raw);
  }
}

export type VeoStatus =
  | { status: "running" }
  | { status: "done"; uri: string; mimeType: string }
  | { status: "error"; message: string };

/** Operation durumunu sorgular. */
export async function getVideoStatus(operationId: string): Promise<VeoStatus> {
  try {
    const ai = client();
    const op = await ai.operations.getVideosOperation({
      // Sadece isim ile yeniden sorgula.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operation: { name: operationId } as any,
    });
    if (!op.done) return { status: "running" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opError = (op as any).error;
    if (opError) {
      return { status: "error", message: opError?.message || "Video üretimi başarısız oldu." };
    }
    const video = op.response?.generatedVideos?.[0]?.video;
    if (!video?.uri) {
      return { status: "error", message: "Video çıktısı bulunamadı." };
    }
    return { status: "done", uri: video.uri, mimeType: video.mimeType || "video/mp4" };
  } catch (err) {
    console.error("Veo status hata:", err);
    return { status: "error", message: friendly(err) };
  }
}

/** Tamamlanan videonun MP4 baytlarını indirir. */
export async function downloadVideoBytes(uri: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new VeoError("GEMINI_API_KEY yok.");
  const sep = uri.includes("?") ? "&" : "?";
  const res = await fetch(uri + sep + "key=" + apiKey, {
    headers: { "x-goog-api-key": apiKey },
  });
  if (!res.ok) {
    throw new VeoError(`Video indirilemedi (${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}
