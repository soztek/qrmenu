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

/** Söztek QR Menü için varsayılan reklam prompt şablonu. */
export const DEFAULT_AD_PROMPT = `Create a premium vertical commercial video for a Turkish digital QR menu service called SÖZTEK QR MENÜ.

Use the supplied real QR menu screenshots as the main visual reference.

Do not redesign the interface.
Do not invent another menu.
Preserve existing product photographs, categories, prices and Turkish text.

Create a modern café and restaurant advertising aesthetic.

Dark black interface aesthetic with vibrant green accents.

Show customers scanning a QR code at a café table and accessing the digital menu from their smartphone.

Emphasize:

QR Menü
Fotoğraflı Ürünler
Güncel Fiyatlar
WhatsApp
Instagram
WiFi
Konum

Final screen:

SÖZTEK QR MENÜ
İŞLETMENİZİ DİJİTALE TAŞIYIN
www.soztekqrmenu.com.tr

Vertical 9:16 social media commercial.`;
