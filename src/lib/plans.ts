/**
 * Söztek QR Menü — Abonelik paketleri
 * Tek kaynak: landing fiyat tablosu, abonelik ekranı ve paket kilitleme
 * (feature gating) bu dosyayı kullanır. Fiyatlar taslaktır, sonra ayarlanır.
 */

export type PlanId = "starter" | "pro" | "premium";

/** Pakete göre açılan yetenekler — feature gating bunlara bakar. */
export type Feature =
  | "qr_menu" // temel QR menü + fotoğraflı ürünler + QR üretimi
  | "orders" // sipariş alma + mutfak paneli
  | "tables" // masa yönetimi
  | "multi_language"; // çoklu dil

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Aylık fiyat (TL). */
  priceMonthly: number;
  features: Feature[];
  /** Landing'de gösterilecek madde listesi. */
  highlights: string[];
  /** "En popüler" rozeti. */
  popular?: boolean;
}

export const TRIAL_DAYS = 7;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Başlangıç",
    tagline: "Dijital menüye ilk adım",
    priceMonthly: 249,
    features: ["qr_menu"],
    highlights: [
      "Sınırsız kategori ve ürün",
      "Ürün fotoğrafları",
      "QR kod üretimi",
      "Mobil uyumlu menü",
      "Menüyü anında güncelleme",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Sipariş alan işletmeler için",
    priceMonthly: 449,
    popular: true,
    features: ["qr_menu", "orders"],
    highlights: [
      "Başlangıç'taki her şey",
      "Müşteriden QR ile sipariş alma",
      "Canlı mutfak paneli",
      "Sipariş durumu takibi",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Tam kapsamlı işletme yönetimi",
    priceMonthly: 749,
    features: ["qr_menu", "orders", "tables", "multi_language"],
    highlights: [
      "Pro'daki her şey",
      "Masa yönetimi ve masaya özel QR",
      "Çoklu dil desteği",
      "Öncelikli destek",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Bilinmeyen paket: ${id}`);
  return plan;
}

/** Bir paket, verilen özelliğe erişebiliyor mu? */
export function planHasFeature(id: PlanId, feature: Feature): boolean {
  return getPlan(id).features.includes(feature);
}

/** TL fiyatı biçimlendir: 199 -> "₺199". */
export function formatPrice(tl: number): string {
  return `₺${tl.toLocaleString("tr-TR")}`;
}
