/** Uygulama kök adresi (sonda / olmadan). */
export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Bir işletmenin herkese açık menü adresi (tam URL). */
export function menuUrl(slug: string): string {
  return `${appUrl()}/m/${slug}`;
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
