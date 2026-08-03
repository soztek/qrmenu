import "server-only";
import { isAIConfigured, openaiConfig } from "./config";
import { contentTypeLabel } from "./types";
import type { SocialPostType } from "@/generated/prisma/enums";

/**
 * AIContentService — Instagram metin içeriği üretimi.
 * Sağlayıcı: OpenAI (Chat Completions, JSON çıktısı). Anahtar yalnızca sunucuda.
 * Sağlayıcı soyutlanmıştır; ileride başka bir modele geçmek bu dosyayla sınırlıdır.
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
      "AI içerik üretimi şu an kapalı. Yönetici OpenAI anahtarını (OPENAI_API_KEY) eklemeli.",
    );
  }
  const { apiKey, model } = openaiConfig();

  const system = [
    "Sen bir restoran/kafe için uzman bir sosyal medya içerik editörüsün.",
    "Türkçe, akıcı, samimi ama profesyonel bir dille Instagram gönderisi yazarsın.",
    "Abartılı vaatlerden ve klişelerden kaçın; iştah açıcı, net ve marka güveni veren bir ton kullan.",
    "Yalnızca verilen bilgilere sadık kal; olmayan ürün, fiyat veya özellik uydurma.",
    "Emojileri ölçülü kullan. Hashtag'leri Türkçe + sektörel karışık, 8-15 adet üret.",
    "SADECE şu şemada geçerli JSON döndür, başka metin yazma:",
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

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              "Aşağıdaki bilgilerle bir Instagram gönderisi üret:\n" +
              JSON.stringify(ctx, null, 2),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("OpenAI network error:", err);
    throw new AIContentError("AI servisine ulaşılamadı, tekrar deneyin.");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI error:", res.status, detail.slice(0, 500));
    if (res.status === 401) {
      throw new AIContentError("AI anahtarı geçersiz. Yönetici ayarlarını kontrol etmeli.");
    }
    if (res.status === 429) {
      throw new AIContentError("AI servisi şu an yoğun/limit doldu, biraz sonra deneyin.");
    }
    throw new AIContentError("AI içerik üretilemedi, tekrar deneyin.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
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
