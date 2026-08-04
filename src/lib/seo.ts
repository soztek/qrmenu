// Site geneli SEO sabitleri (Söztek QR Menü)
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.soztekqrmenu.com.tr").replace(/\/$/, "");
export const SITE_NAME = "Söztek QR Menü";

export function abs(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : "/" + path}`;
}
