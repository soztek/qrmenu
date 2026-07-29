/**
 * Yasal uyumluluk / şeffaf menü sabitleri.
 * 14 resmi alerjen + et türleri. Menü kurucu ve menü gösterimi bunları kullanır.
 */

export interface Allergen {
  key: string;
  label: string;
  icon: string;
}

export const ALLERGENS: Allergen[] = [
  { key: "gluten", label: "Gluten", icon: "🌾" },
  { key: "sut", label: "Süt / Laktoz", icon: "🥛" },
  { key: "yumurta", label: "Yumurta", icon: "🥚" },
  { key: "fistik", label: "Yer fıstığı", icon: "🥜" },
  { key: "kuruyemis", label: "Sert kabuklu yemiş", icon: "🌰" },
  { key: "soya", label: "Soya", icon: "🫘" },
  { key: "balik", label: "Balık", icon: "🐟" },
  { key: "kabuklu", label: "Kabuklu deniz ürünü", icon: "🦐" },
  { key: "yumusakca", label: "Yumuşakça", icon: "🦑" },
  { key: "susam", label: "Susam", icon: "◦" },
  { key: "hardal", label: "Hardal", icon: "🌭" },
  { key: "kereviz", label: "Kereviz", icon: "🥬" },
  { key: "sulfit", label: "Sülfit", icon: "🍷" },
  { key: "acibakla", label: "Acı bakla (Lupin)", icon: "🌱" },
];

export interface MeatType {
  key: string;
  label: string;
}

export const MEAT_TYPES: MeatType[] = [
  { key: "dana", label: "Dana" },
  { key: "kuzu", label: "Kuzu" },
  { key: "kanatli", label: "Kanatlı (Tavuk/Hindi)" },
  { key: "balik", label: "Balık / Deniz ürünü" },
  { key: "karisik", label: "Karışık et" },
];

const ALLERGEN_KEYS = new Set(ALLERGENS.map((a) => a.key));
const MEAT_KEYS = new Set(MEAT_TYPES.map((m) => m.key));

export function isAllergenKey(k: string): boolean {
  return ALLERGEN_KEYS.has(k);
}
export function isMeatKey(k: string): boolean {
  return MEAT_KEYS.has(k);
}

export function allergen(key: string): Allergen | undefined {
  return ALLERGENS.find((a) => a.key === key);
}
export function meatLabel(key: string | null | undefined): string | null {
  return MEAT_TYPES.find((m) => m.key === key)?.label ?? null;
}
