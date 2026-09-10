import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Ziyaretçiler" };
export const dynamic = "force-dynamic";

/** İstanbul saatine göre bir günün başlangıcını (UTC anı olarak) döndürür. */
function istanbulDayStart(daysAgo = 0): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${ymd}T00:00:00+03:00`);
  start.setDate(start.getDate() - daysAgo);
  return start;
}

function istanbulDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Yolu okunur etikete çevirir: "/" → Ana Sayfa, "/m/xyz" → "Menü: xyz". */
function pathLabel(path: string): string {
  if (path === "/") return "Ana Sayfa";
  const m = path.match(/^\/m\/(.+)$/);
  if (m) return `Menü: ${m[1]}`;
  return path;
}

export default async function VisitorsPage() {
  await requireAdmin();

  const startToday = istanbulDayStart(0);
  const start7 = istanbulDayStart(6); // bugün dahil son 7 gün

  const [totalViews, ipsAll, viewsToday, ipsToday, last7Raw, topPaths, recent] =
    await Promise.all([
      prisma.visit.count(),
      prisma.visit.groupBy({ by: ["ip"] }),
      prisma.visit.count({ where: { createdAt: { gte: startToday } } }),
      prisma.visit.groupBy({ by: ["ip"], where: { createdAt: { gte: startToday } } }),
      prisma.visit.findMany({
        where: { createdAt: { gte: start7 } },
        select: { ip: true, createdAt: true },
      }),
      prisma.visit.groupBy({
        by: ["path"],
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.visit.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, ip: true, path: true, createdAt: true },
      }),
    ]);

  const uniqueIpsAll = ipsAll.length;
  const uniqueIpsToday = ipsToday.length;

  // Son 7 günü İstanbul tarihine göre grupla
  const dayMap = new Map<string, { views: number; ips: Set<string> }>();
  for (let i = 6; i >= 0; i--) {
    dayMap.set(istanbulDate(istanbulDayStart(i)), { views: 0, ips: new Set() });
  }
  for (const v of last7Raw) {
    const bucket = dayMap.get(istanbulDate(new Date(v.createdAt)));
    if (bucket) {
      bucket.views++;
      bucket.ips.add(v.ip);
    }
  }
  const days = [...dayMap.entries()].map(([date, b]) => ({
    date,
    views: b.views,
    ips: b.ips.size,
  }));
  const maxDayViews = Math.max(1, ...days.map((d) => d.views));

  const cards = [
    { label: "Farklı IP (Toplam)", value: uniqueIpsAll, hl: true },
    { label: "Bugün Farklı IP", value: uniqueIpsToday, hl: false },
    { label: "Toplam Görüntüleme", value: totalViews, hl: false },
    { label: "Bugün Görüntüleme", value: viewsToday, hl: false },
  ];

  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-fg">Ziyaretçiler</h1>
      <p className="mt-1 text-sm text-muted">
        Herkese açık sayfaları (ana sayfa + menüler) ziyaret eden farklı IP adresleri ve
        görüntülemeler. Yönetim/panel sayfaları sayılmaz.
      </p>

      {/* Özet kartlar */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-5 ${
              c.hl ? "border-green/40 bg-green-soft/40" : "border-border bg-surface"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-faint">
              {c.label}
            </div>
            <p className="mt-2 text-3xl font-extrabold text-green">
              {c.value.toLocaleString("tr-TR")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Son 7 gün */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-fg">Son 7 Gün</h2>
          <div className="mt-4 space-y-3">
            {days.map((d) => {
              const dt = new Date(`${d.date}T12:00:00+03:00`);
              const label = `${dayNames[dt.getDay()]} ${dt.toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "2-digit",
              })}`;
              return (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-muted">{label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-green to-green-dark px-2 text-xs font-semibold text-black"
                      style={{ width: `${Math.max(6, (d.views / maxDayViews) * 100)}%` }}
                    >
                      {d.views > 0 ? d.views : ""}
                    </div>
                  </div>
                  <span className="w-24 shrink-0 text-right text-muted">
                    {d.ips} farklı IP
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* En çok görüntülenen sayfalar */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-fg">En Çok Görüntülenen Sayfalar</h2>
          {topPaths.length === 0 ? (
            <p className="mt-4 text-sm text-faint">Henüz veri yok.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {topPaths.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-fg" title={p.path}>
                    {pathLabel(p.path)}
                  </span>
                  <span className="shrink-0 rounded-full bg-green-soft px-2.5 py-0.5 text-xs font-bold text-green">
                    {p._count.path.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Son ziyaretler */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-fg">Son Ziyaretler</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-faint">Henüz ziyaret kaydı yok.</p>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden grid-cols-[160px_1fr_170px] gap-3 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-faint sm:grid">
              <span>IP Adresi</span>
              <span>Sayfa</span>
              <span className="text-right">Zaman</span>
            </div>
            {recent.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-[160px_1fr_170px] sm:gap-3"
              >
                <span className="font-mono text-muted">{v.ip}</span>
                <span className="truncate text-fg" title={v.path}>
                  {pathLabel(v.path)}
                </span>
                <span className="text-faint sm:text-right">
                  {new Date(v.createdAt).toLocaleString("tr-TR", {
                    timeZone: "Europe/Istanbul",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
