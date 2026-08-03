/**
 * Sosyal Medya Asistanı — paylaşılan tipler ve etiketler.
 * (Sunucu + client bileşenlerinde kullanılabilir; "server-only" YOK.)
 */
import type {
  SocialPostStatus,
  SocialPostType,
  SocialPlatform,
} from "@/generated/prisma/enums";

export type { SocialPostStatus, SocialPostType, SocialPlatform };

/** İçerik türü seçenekleri (kullanıcı arayüzü). */
export const CONTENT_TYPES: {
  id: SocialPostType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { id: "product", emoji: "🍽️", label: "Ürün Tanıtımı", description: "Menüdeki bir ürünü öne çıkar." },
  { id: "restaurant", emoji: "🏪", label: "Restoran Tanıtımı", description: "İşletmenin genel tanıtımı." },
  { id: "menu", emoji: "📋", label: "Menü Tanıtımı", description: "Menüye ve kategorilere davet." },
  { id: "campaign", emoji: "🎉", label: "Kampanya", description: "İndirim / kampanya duyurusu." },
  { id: "qr_menu", emoji: "📱", label: "QR Menü Tanıtımı", description: "Dijital QR menüyü tanıt." },
  { id: "educational", emoji: "💡", label: "Eğitici İçerik", description: "Bilgilendirici, değer katan içerik." },
  { id: "customer_acquisition", emoji: "🎯", label: "Müşteri Kazanma", description: "Yeni müşteri çeken içerik." },
  { id: "special_day", emoji: "🗓️", label: "Özel Gün", description: "Bayram / özel gün içeriği." },
  { id: "auto", emoji: "🤖", label: "Otomatik İçerik", description: "AI uygun bir içerik seçsin." },
];

export function contentTypeLabel(t: SocialPostType): string {
  return CONTENT_TYPES.find((c) => c.id === t)?.label ?? t;
}

/** Gönderi durumu etiketleri (renk = tema tokenı adı). */
export const STATUS_META: Record<
  SocialPostStatus,
  { label: string; tone: "muted" | "green" | "orange" | "red" }
> = {
  draft: { label: "Taslak", tone: "muted" },
  pending_approval: { label: "Onay bekliyor", tone: "orange" },
  approved: { label: "Onaylandı", tone: "green" },
  scheduled: { label: "Zamanlandı", tone: "orange" },
  publishing: { label: "Yayınlanıyor", tone: "orange" },
  published: { label: "Yayınlandı", tone: "green" },
  failed: { label: "Başarısız", tone: "red" },
  rejected: { label: "Reddedildi", tone: "red" },
};

/** Görsel formatları. */
export const POST_FORMATS = {
  portrait: { label: "Dikey (1080×1350)", width: 1080, height: 1350, ratio: "4:5" },
  square: { label: "Kare (1080×1080)", width: 1080, height: 1080, ratio: "1:1" },
} as const;

export type PostFormat = keyof typeof POST_FORMATS;

/** Platform görünen adı. */
export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google İşletme",
};
