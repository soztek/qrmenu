import { prisma } from "@/lib/db";

export type VisitKind = "landing" | "menu";

/** İstanbul takvimine göre bugünün tarihi (UTC gece yarısı olarak). */
export function istanbulToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Bugünden geriye n günlük tarih listesi (eskiden yeniye). */
export function lastNDays(n: number): Date[] {
  const today = istanbulToday();
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d);
  }
  return out;
}

/** Bugünün sayaç değerini +1 artırır (herkese açık sayfa görüntülenmesi). */
export async function recordVisit(kind: VisitKind): Promise<void> {
  const day = istanbulToday();
  await prisma.pageVisit.upsert({
    where: { day_kind: { day, kind } },
    create: { day, kind, count: 1 },
    update: { count: { increment: 1 } },
  });
}
