import type { CSSProperties } from "react";

/**
 * Herkese açık menü renk temaları. Her tema, globals.css'teki token'ları
 * (CSS değişkenleri) override eder; menü kökündeki bir div'e inline style
 * olarak uygulanır, tüm alt öğeler (bg-green, text-orange, ...) o temayı alır.
 * 60-30-10: bg=%60 zemin, surface/fg=%30 yapı, green(primary)=%10 CTA.
 */
export interface MenuTheme {
  id: string;
  label: string;
  description: string;
  /** Önizleme için [zemin, ana renk, vurgu]. */
  swatch: [string, string, string];
  vars: Record<string, string>;
}

export const MENU_THEMES: MenuTheme[] = [
  {
    id: "dark",
    label: "Söztek Koyu",
    description: "Siyah zemin + yeşil + turuncu. Modern ve iddialı.",
    swatch: ["#0a0a0b", "#22c55e", "#f97316"],
    vars: {
      "--color-bg": "#0a0a0b",
      "--color-surface": "#121214",
      "--color-surface-2": "#1a1a1e",
      "--color-border": "#26262c",
      "--color-fg": "#f5f5f4",
      "--color-muted": "#a1a1aa",
      "--color-faint": "#71717a",
      "--color-green": "#22c55e",
      "--color-green-dark": "#16a34a",
      "--color-green-soft": "#052e16",
      "--color-orange": "#f97316",
      "--color-orange-dark": "#ea580c",
      "--color-orange-soft": "#2a1206",
      "--color-on-primary": "#0a0a0b",
    },
  },
  {
    id: "corporate",
    label: "Kurumsal Güven",
    description: "Lacivert + canlı mavi + beyaz. Profesyonel ve net.",
    swatch: ["#f7f9fc", "#2563eb", "#1e3a8a"],
    vars: {
      "--color-bg": "#f7f9fc",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#eef2f7",
      "--color-border": "#dce3ec",
      "--color-fg": "#0f1f3d",
      "--color-muted": "#4a5b73",
      "--color-faint": "#94a3b8",
      "--color-green": "#2563eb",
      "--color-green-dark": "#1d4ed8",
      "--color-green-soft": "#dbeafe",
      "--color-orange": "#1e3a8a",
      "--color-orange-dark": "#1e40af",
      "--color-orange-soft": "#e6ecf7",
      "--color-on-primary": "#ffffff",
    },
  },
  {
    id: "luxury",
    label: "Modern Lüks",
    description: "Derin siyah + krem + sıcak altın. Şık ve prestijli.",
    swatch: ["#0c0a09", "#d4af37", "#e0b84d"],
    vars: {
      "--color-bg": "#0c0a09",
      "--color-surface": "#1a1613",
      "--color-surface-2": "#24201b",
      "--color-border": "#38322a",
      "--color-fg": "#f5efe2",
      "--color-muted": "#b7ad9a",
      "--color-faint": "#857a68",
      "--color-green": "#d4af37",
      "--color-green-dark": "#b8942e",
      "--color-green-soft": "#2a2213",
      "--color-orange": "#e0b84d",
      "--color-orange-dark": "#c9a227",
      "--color-orange-soft": "#2a2213",
      "--color-on-primary": "#1a1613",
    },
  },
  {
    id: "organic",
    label: "Doğal & Organik",
    description: "Orman yeşili + kum beji + beyaz. Taze ve sıcak.",
    swatch: ["#faf8f2", "#3f6f52", "#b8763e"],
    vars: {
      "--color-bg": "#faf8f2",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#f1ede2",
      "--color-border": "#e4ddcd",
      "--color-fg": "#1f2a22",
      "--color-muted": "#566b5b",
      "--color-faint": "#9aa596",
      "--color-green": "#3f6f52",
      "--color-green-dark": "#2f5540",
      "--color-green-soft": "#e0eae2",
      "--color-orange": "#b8763e",
      "--color-orange-dark": "#9c6234",
      "--color-orange-soft": "#f3e8dc",
      "--color-on-primary": "#ffffff",
    },
  },
  {
    id: "warm",
    label: "Sıcak Neşe",
    description: "Canlı turuncu + pembe. İştah açan, neşeli, enerjik.",
    swatch: ["#fff8f3", "#f4511e", "#e91e63"],
    vars: {
      "--color-bg": "#fff8f3",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#ffeede",
      "--color-border": "#ffdcc4",
      "--color-fg": "#40260f",
      "--color-muted": "#8a5a3c",
      "--color-faint": "#c99e7d",
      "--color-green": "#f4511e",
      "--color-green-dark": "#d84315",
      "--color-green-soft": "#ffe2d3",
      "--color-orange": "#e91e63",
      "--color-orange-dark": "#c2185b",
      "--color-orange-soft": "#fde3ec",
      "--color-on-primary": "#ffffff",
    },
  },
  {
    id: "tropical",
    label: "Tropik",
    description: "Canlı teal + mercan. Ferah, taze, modern.",
    swatch: ["#f0fdfc", "#06b6d4", "#fb7185"],
    vars: {
      "--color-bg": "#f0fdfc",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#d5f7f0",
      "--color-border": "#a7efe4",
      "--color-fg": "#0c3b37",
      "--color-muted": "#0f766e",
      "--color-faint": "#5fc9bd",
      "--color-green": "#06b6d4",
      "--color-green-dark": "#0891b2",
      "--color-green-soft": "#cffafe",
      "--color-orange": "#fb7185",
      "--color-orange-dark": "#f43f5e",
      "--color-orange-soft": "#ffe4e6",
      "--color-on-primary": "#ffffff",
    },
  },
  {
    id: "berry",
    label: "Canlı Mor",
    description: "Canlı mor + amber. Cesur, modern, dikkat çekici.",
    swatch: ["#fdf4ff", "#a21caf", "#f59e0b"],
    vars: {
      "--color-bg": "#fdf4ff",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#f7e8ff",
      "--color-border": "#ecd5ff",
      "--color-fg": "#3b0764",
      "--color-muted": "#6d5a86",
      "--color-faint": "#b39ddb",
      "--color-green": "#a21caf",
      "--color-green-dark": "#86198f",
      "--color-green-soft": "#fae8ff",
      "--color-orange": "#f59e0b",
      "--color-orange-dark": "#d97706",
      "--color-orange-soft": "#fef3c7",
      "--color-on-primary": "#ffffff",
    },
  },
];

export function getMenuTheme(id: string | null | undefined): MenuTheme {
  return MENU_THEMES.find((t) => t.id === id) ?? MENU_THEMES[0];
}

/** Temanın CSS değişkenlerini React style objesine çevirir. */
export function themeStyle(id: string | null | undefined): CSSProperties {
  return getMenuTheme(id).vars as CSSProperties;
}
