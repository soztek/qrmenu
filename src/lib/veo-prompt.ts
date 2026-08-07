/**
 * Veo (AI Reklam Stüdyosu) — client + server ortak sabitler.
 * server-only YOK; hem arayüz hem API route kullanır.
 */

export type VeoModelKey = "fast" | "quality";

export const VEO_MODELS: { key: VeoModelKey; label: string; id: string; hint: string }[] = [
  {
    key: "fast",
    label: "Veo 3.1 Fast",
    id: "veo-3.1-fast-generate-preview",
    hint: "Daha hızlı ve ekonomik",
  },
  {
    key: "quality",
    label: "Veo 3.1 Quality",
    id: "veo-3.1-generate-preview",
    hint: "Daha yüksek kalite (daha yavaş/pahalı)",
  },
];

export function veoModelId(key: VeoModelKey): string {
  return VEO_MODELS.find((m) => m.key === key)?.id ?? VEO_MODELS[0].id;
}

/** Reels formatları — ikisi de 9:16. */
export const VIDEO_FORMATS: { key: string; label: string; aspectRatio: string }[] = [
  { key: "instagram", label: "Instagram Reels (9:16)", aspectRatio: "9:16" },
  { key: "facebook", label: "Facebook Reels (9:16)", aspectRatio: "9:16" },
];

export const MAX_REFERENCE_IMAGES = 3;

/** Süre seçenekleri (Veo tek üretimde ~8sn'e kadar). */
export const DURATIONS = [4, 6, 8];
export const DEFAULT_DURATION = 8;

/**
 * İstenmeyen çıktıyı bastırmak için varsayılan negatif prompt.
 * Yazı/harf bastırma güçlü — çünkü Veo metni bozuk üretir; markayı sonradan ekleriz.
 */
export const DEFAULT_NEGATIVE_PROMPT =
  "on-screen text, letters, words, captions, subtitles, typography, gibberish text, warped text, watermark, logo, distorted, deformed hands, extra fingers, low quality, blurry, oversaturated";

/**
 * Söztek QR Menü için varsayılan reklam prompt şablonu.
 * Strateji: TEMİZ SİNEMATİK ÇEKİM üret, ekranda YAZI YOK (Veo yazıyı bozar).
 * Marka yazısı/CTA sonradan düzenlemeyle eklenir.
 */
export const DEFAULT_AD_PROMPT = `Cinematic vertical 9:16 commercial b-roll for a modern café / restaurant. Premium, warm and inviting.

A customer sits at a cozy café table and scans a QR code on the table with their smartphone; the phone screen glows as a sleek dark food menu with vibrant green accents appears. Slow smooth camera moves, shallow depth of field, warm natural lighting, gentle steam and bokeh. Appetizing close-ups of the food and of the glowing phone screen in hand.

Absolutely NO on-screen text, no words, no letters, no logos — clean cinematic footage only.

Mood: appetizing, trustworthy, high-end and modern. Real, photographic look.`;
