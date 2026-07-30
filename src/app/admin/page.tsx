import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { statusLabel } from "@/lib/subscription";
import { lastNDays } from "@/lib/visits";

export const metadata: Metadata = { title: "Admin — Genel bakış" };
export const dynamic = "force-dynamic";

function trDate(d: Date): string {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminHome() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [total, trialing, active, pastDueOrCanceled, lastWeek, recent] =
    await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { subscriptionStatus: "trialing" } }),
      prisma.business.count({ where: { subscriptionStatus: "active" } }),
      prisma.business.count({
        where: { subscriptionStatus: { in: ["past_due", "canceled"] } },
      }),
      prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.business.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          createdAt: true,
          owner: { select: { email: true } },
        },
      }),
    ]);

  // Ziyaretler — son 14 gün
  const days = lastNDays(14);
  const visitRows = await prisma.pageVisit.findMany({
    where: { day: { gte: days[0] } },
  });
  const byDay = new Map<string, { landing: number; menu: number }>();
  for (const r of visitRows) {
    const k = r.day.toISOString().slice(0, 10);
    const cur = byDay.get(k) ?? { landing: 0, menu: 0 };
    if (r.kind === "menu") cur.menu += r.count;
    else cur.landing += r.count;
    byDay.set(k, cur);
  }
  const series = days.map((d) => {
    const v = byDay.get(d.toISOString().slice(0, 10)) ?? { landing: 0, menu: 0 };
    return { date: d, ...v, total: v.landing + v.menu };
  });
  const todayVisits = series[series.length - 1]?.total ?? 0;
  const total14 = series.reduce((s, x) => s + x.total, 0);
  const maxDay = Math.max(1, ...series.map((x) => x.total));

  // Menü ziyaretleri — işletme bazlı (son 14 gün)
  const todayKey = days[days.length - 1].toISOString().slice(0, 10);
  const menuRows = await prisma.menuVisit.findMany({
    where: { day: { gte: days[0] } },
    include: { business: { select: { name: true, slug: true } } },
  });
  const bizMap = new Map<
    string,
    { name: string; slug: string; today: number; total: number }
  >();
  for (const r of menuRows) {
    const cur =
      bizMap.get(r.businessId) ??
      { name: r.business.name, slug: r.business.slug, today: 0, total: 0 };
    cur.total += r.count;
    if (r.day.toISOString().slice(0, 10) === todayKey) cur.today += r.count;
    bizMap.set(r.businessId, cur);
  }
  const bizVisits = [...bizMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Genel bakış</h1>
      <p className="mt-1 text-muted">Platformdaki tüm işletmeler ve abonelikler.</p>

      {/* İstatistikler */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Toplam işletme" value={total} />
        <StatCard label="Denemede" value={trialing} tone="green" />
        <StatCard label="Aktif abonelik" value={active} tone="green" />
        <StatCard label="Pasif / iptal" value={pastDueOrCanceled} tone="orange" />
        <StatCard label="Son 7 gün kayıt" value={lastWeek} />
      </div>

      {/* Site ziyaretleri */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Site ziyaretleri</h2>
          <span className="text-xs text-faint">
            Son 14 gün · saat dilimi: İstanbul
          </span>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <StatCard label="Bugün ziyaret" value={todayVisits} tone="green" />
          <StatCard label="Son 14 gün toplam" value={total14} />
          <StatCard label="Günlük ortalama" value={Math.round(total14 / 14)} />
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="space-y-1.5">
            {series
              .slice()
              .reverse()
              .map((x, i) => (
                <div
                  key={x.date.toISOString()}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className={`w-24 shrink-0 ${i === 0 ? "font-semibold text-fg" : "text-faint"}`}
                  >
                    {x.date.toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "UTC",
                    })}
                    {i === 0 && " (bugün)"}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
                    <div
                      className="h-full rounded bg-green"
                      style={{ width: `${(x.total / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-medium">
                    {x.total}
                  </span>
                </div>
              ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Landing + menü sayfa görüntülenmeleri. Aynı ziyaretçi aynı oturumda
            tekrar sayılmaz.
          </p>
        </div>
      </div>

      {/* Menü ziyaretleri — işletme bazlı */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Menü ziyaretleri (işletme bazlı)</h2>
          <span className="text-xs text-faint">
            Son 14 gün · en çok görüntülenen ilk 20
          </span>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-faint">
              <tr>
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3 text-right">Bugün</th>
                <th className="px-4 py-3 text-right">Son 14 gün</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bizVisits.map((b) => (
                <tr key={b.slug} className="bg-surface/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.name}</div>
                    <a
                      href={`/m/${b.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green hover:underline"
                    >
                      /m/{b.slug} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green">
                    {b.today}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{b.total}</td>
                </tr>
              ))}
              {bizVisits.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-faint">
                    Henüz menü ziyareti kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Son kayıtlar */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-semibold">Son kayıtlar</h2>
        <Link
          href="/admin/businesses"
          className="text-sm font-medium text-green hover:underline"
        >
          Tümünü gör →
        </Link>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3">İşletme</th>
              <th className="px-4 py-3">Sahip</th>
              <th className="px-4 py-3">Paket</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recent.map((b) => (
              <tr key={b.id} className="bg-surface/40">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-muted">{b.owner?.email ?? "—"}</td>
                <td className="px-4 py-3">{getPlan(b.plan).name}</td>
                <td className="px-4 py-3 text-muted">{statusLabel(b)}</td>
                <td className="px-4 py-3 text-faint">{trDate(b.createdAt)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-faint">
                  Henüz kayıtlı işletme yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "orange";
}) {
  const color =
    tone === "green" ? "text-green" : tone === "orange" ? "text-orange" : "text-fg";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
