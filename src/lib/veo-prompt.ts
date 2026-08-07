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

/** İstenmeyen çıktıyı bastırmak için varsayılan negatif prompt. */
export const DEFAULT_NEGATIVE_PROMPT =
  "distorted text, gibberish text, warped interface, extra fingers, low quality, blurry, watermark, logo distortion";

/**
 * Söztek QR Menü için varsayılan reklam prompt şablonu.
 * Veo daha iyi takip etsin diye: kısa, sinematik, hareket odaklı, pozitif ifadeler.
 */
export const DEFAULT_AD_PROMPT = `Premium vertical 9:16 commercial for a Turkish digital QR menu service, SÖZTEK QR MENÜ.

Scene: a cozy modern café. A customer scans a QR code on the table with their smartphone; the phone reveals the digital menu from the reference image — real food photos, categories and Turkish prices on a sleek dark interface with vibrant green accents.

Cinematic, shallow depth of field, smooth camera motion, warm café lighting, appetizing close-ups of food and the phone screen. Modern, clean, trustworthy tech aesthetic.

Feature keywords appearing as elegant on-screen text: QR Menü, Fotoğraflı Ürünler, Güncel Fiyatlar, WhatsApp, Instagram, WiFi, Konum.

Final end card on black with green accent text:
SÖZTEK QR MENÜ
İŞLETMENİZİ DİJİTALE TAŞIYIN
www.soztekqrmenu.com.tr`;
