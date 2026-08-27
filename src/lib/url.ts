/** Uygulama kök adresi (sonda / olmadan). */
export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Bir işletmenin herkese açık menü adresi (tam URL). */
export function menuUrl(slug: string): string {
  return `${appUrl()}/m/${slug}`;
}

/**
 * İşletmenin menü adresi — özel alan adı (customDomain) varsa onu, yoksa
 * platform adresini döner. QR kodları ve dış bağlantılar bunu kullanır.
 */
export function businessMenuUrl(b: {
  slug: string;
  customDomain?: string | null;
}): string {
  return b.customDomain ? `https://${b.customDomain}` : menuUrl(b.slug);
}

/** İşletmenin belirli bir masa için sipariş adresi (özel domain varsa onu kullanır). */
export function businessTableUrl(
  b: { slug: string; customDomain?: string | null },
  token: string,
): string {
  return b.customDomain
    ? `https://${b.customDomain}/?t=${token}`
    : `${menuUrl(b.slug)}?t=${token}`;
}

/** Türk telefon numarasından wa.me linki üretir (0536… -> https://wa.me/90536…). */
export function waLink(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (!d.startsWith("90")) d = "90" + d;
  return `https://wa.me/${d}`;
}

/** TL fiyat biçimi: Decimal/number/string -> "₺75,00". */
export function formatTL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}
