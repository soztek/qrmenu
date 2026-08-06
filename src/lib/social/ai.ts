import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured, anthropicConfig } from "./config";
import { contentTypeLabel } from "./types";
import type { SocialPostType } from "@/generated/prisma/enums";

/**
 * AIContentService — Instagram metin içeriği üretimi.
 * Sağlayıcı: Anthropic (Claude). Anahtar yalnızca sunucuda.
 * Sağlayıcı soyutlanmıştır; başka bir modele geçmek bu dosyayla sınırlıdır.
 */

export class AIContentError extends Error {}

export interface AIContentInput {
  type: SocialPostType;
  userPrompt?: string;
  business: {
    name: string;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    menuUrl?: string | null;
  };
  menuItem?: {
    name: string;
    description?: string | null;
    price?: string | null;
    categoryName?: string | null;
  } | null;
  brandTone?: string | null;
  extraHashtags?: string[];
}

export interface AIContentResult {
  title: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageConcept: string;
  caption: string; // IG'ye gidecek nihai açıklama (body + cta + hashtag)
  model: string;
}

/** body + cta + hashtag'leri tek bir Instagram açıklamasına birleştirir. */
export function buildCaption(parts: {
  body: string;
  cta?: string;
  hashtags: string[];
}): string {
  const tags = parts.hashtags
    .map((h) => "#" + h.replace(/^#/, "").replace(/\s+/g, ""))
    .join(" ");
  return [parts.body, parts.cta, tags].filter((s) => s && s.trim()).join("\n\n");
}

export async function generateContent(
  input: AIContentInput,
): Promise<AIContentResult> {
  if (!isAIConfigured()) {
    throw new AIContentError(
      "AI içerik üretimi şu an kapalı. Yönetici Anthropic anahtarını (ANTHROPIC_API_KEY) eklemeli.",
    );
  }
  const { apiKey, model } = anthropicConfig();

  const system = [
    "Sen bir restoran/kafe için uzman bir sosyal medya içerik editörüsün.",
    "Türkçe, akıcı, samimi ama profesyonel bir dille Instagram gönderisi yazarsın.",
    "Abartılı vaatlerden ve klişelerden kaçın; iştah açıcı, net ve marka güveni veren bir ton kullan.",
    "Yalnızca verilen bilgilere sadık kal; olmayan ürün, fiyat veya özellik uydurma.",
    "Emojileri ölçülü kullan. Hashtag'leri Türkçe + sektörel karışık, 8-15 adet üret.",
    "SADECE şu şemada geçerli JSON döndür, başka hiçbir metin/açıklama yazma:",
    '{"title": string, "body": string, "cta": string, "hashtags": string[], "imageConcept": string}',
    "title: kısa başlık. body: 2-4 cümle açıklama. cta: tek cümle çağrı. imageConcept: görsel için kısa sahne betimi (Türkçe).",
  ].join(" ");

  const ctx: Record<string, unknown> = {
    icerik_turu: contentTypeLabel(input.type),
    kullanici_notu: input.userPrompt || null,
    marka_tonu: input.brandTone || null,
    isletme: {
      ad: input.business.name,
      aciklama: input.business.description || null,
      adres: input.business.address || null,
      telefon: input.business.phone || null,
      web: input.business.website || null,
      qr_menu_linki: input.business.menuUrl || null,
    },
    urun: input.menuItem
      ? {
          ad: input.menuItem.name,
          aciklama: input.menuItem.description || null,
          fiyat: input.menuItem.price || null,
          kategori: input.menuItem.categoryName || null,
        }
      : null,
    platform: "Söztek QR Menü (dijital QR menü platformu)",
  };

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 900,
      system,
      messages: [
        {
          role: "user",
          content:
            "Aşağıdaki bilgilerle bir Instagram gönderisi üret ve SADECE JSON döndür:\n" +
            JSON.stringify(ctx, null, 2),
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (err) {
    const detail =
      err instanceof Anthropic.APIError
        ? `${err.status ?? ""} ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("Anthropic içerik hatası:", detail);
    if (err instanceof Anthropic.APIError && err.status === 401) {
      throw new AIContentError("AI anahtarı geçersiz. Yönetici ayarlarını kontrol etmeli.");
    }
    if (err instanceof Anthropic.APIError && err.status === 429) {
      throw new AIContentError("AI servisi şu an yoğun/limit doldu, biraz sonra deneyin.");
    }
    throw new AIContentError("AI içerik üretilemedi, tekrar deneyin.");
  }

  // Olası kod bloğu/çerçeveleri temizle, ilk JSON nesnesini yakala.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new AIContentError("AI yanıtı çözümlenemedi, tekrar deneyin.");
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    throw new AIContentError("AI yanıtı çözümlenemedi, tekrar deneyin.");
  }

  const str = (v: unknown) => String(v ?? "").trim();
  const title = str(parsed.title).slice(0, 120);
  const body = str(parsed.body).slice(0, 1500);
  const cta = str(parsed.cta).slice(0, 200);
  const imageConcept = str(parsed.imageConcept).slice(0, 400);

  const seen = new Set<string>();
  const hashtags = (Array.isArray(parsed.hashtags) ? parsed.hashtags : [])
    .map((h) => str(h).replace(/^#/, "").replace(/\s+/g, ""))
    .filter((h) => {
      const k = h.toLowerCase();
      if (!h || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 30);

  if (input.extraHashtags?.length) {
    for (const h of input.extraHashtags) {
      const clean = h.replace(/^#/, "").replace(/\s+/g, "");
      const k = clean.toLowerCase();
      if (clean && !seen.has(k) && hashtags.length < 30) {
        seen.add(k);
        hashtags.push(clean);
      }
    }
  }

  if (!body && !title) {
    throw new AIContentError("AI içerik üretilemedi, tekrar deneyin.");
  }

  return {
    title,
    body,
    cta,
    hashtags,
    imageConcept,
    caption: buildCaption({ body, cta, hashtags }),
    model,
  };
}
