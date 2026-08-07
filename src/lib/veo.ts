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
  | { status: "error"; message: string; detail?: string };

/**
 * Operation durumunu sorgular — doğrudan REST (SDK operation yeniden kurma
 * sorunlarını bypass eder). Operation adı "models/.../operations/xyz" biçiminde.
 */
export async function getVideoStatus(operationId: string): Promise<VeoStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { status: "error", message: "GEMINI_API_KEY yok." };
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${operationId}`;
    const res = await fetch(url, { headers: { "x-goog-api-key": apiKey } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json().catch(() => null)) as any;

    if (!res.ok) {
      const raw = data?.error?.message || `HTTP ${res.status}`;
      return { status: "error", message: friendly(new Error(raw)), detail: raw };
    }
    if (!data?.done) return { status: "running" };
    if (data.error) {
      return {
        status: "error",
        message: data.error.message || "Video üretimi başarısız oldu.",
        detail: JSON.stringify(data.error).slice(0, 400),
      };
    }

    // Video URI'sini olası farklı yanıt şekillerinde ara.
    const resp = data.response ?? {};
    const uri =
      resp?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
      resp?.generatedVideos?.[0]?.video?.uri ??
      resp?.generateVideoResponse?.generatedVideos?.[0]?.video?.uri ??
      null;
    if (!uri) {
      return {
        status: "error",
        message: "Video çıktısı alınamadı.",
        detail: JSON.stringify(resp).slice(0, 400),
      };
    }
    const mimeType =
      resp?.generateVideoResponse?.generatedSamples?.[0]?.video?.mimeType ||
      "video/mp4";
    return { status: "done", uri, mimeType };
  } catch (err) {
    console.error("Veo status hata:", err);
    const raw = err instanceof Error ? err.message : String(err);
    return { status: "error", message: friendly(err), detail: raw };
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
