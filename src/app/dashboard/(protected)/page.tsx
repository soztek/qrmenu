import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { trialDaysLeft, statusLabel } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import { lastNDays } from "@/lib/visits";

export const metadata: Metadata = { title: "Genel bakış" };
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  // Layout zaten koruyor; tip daraltma için:
  if (!user?.business) return null;

  const business = user.business;
  const plan = getPlan(business.plan);
  const menuUrl = `/m/${business.slug}`;

  // Menü görüntülenmeleri — son 30 gün
  const days = lastNDays(30);
  const visitRows = await prisma.menuVisit.findMany({
    where: { businessId: business.id, day: { gte: days[0] } },
  });
  const byDay = new Map<string, number>();
  for (const r of visitRows) {
    const k = r.day.toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + r.count);
  }
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const todayViews = byDay.get(key(days[days.length - 1])) ?? 0;
  const views7 = days
    .slice(-7)
    .reduce((s, d) => s + (byDay.get(key(d)) ?? 0), 0);
  const views30 = [...byDay.values()].reduce((s, x) => s + x, 0);
  const chart = days.slice(-14).map((d) => ({ date: d, count: byDay.get(key(d)) ?? 0 }));
  const maxC = Math.max(1, ...chart.map((x) => x.count));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Hoş geldin{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
      </h1>
      <p className="mt-1 text-muted">
        {business.name} panelin hazır. Sıradaki adım: menünü oluştur.
      </p>

      {/* Durum kartları */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Paket" value={plan.name} />
        <Stat label="Durum" value={statusLabel(business)} />
        <Stat
          label="Menü adresi"
          value={
            <span className="break-all font-mono text-xs text-green">
              {menuUrl}
            </span>
          }
        />
      </div>

      {/* Menü görüntülenmeleri */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Menü görüntülenmeleri</h2>
          <Link
            href={menuUrl}
            target="_blank"
            className="text-sm font-medium text-green hover:underline"
          >
            Menüyü aç ↗
          </Link>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Stat label="Bugün" value={todayViews} />
          <Stat label="Son 7 gün" value={views7} />
          <Stat label="Son 30 gün" value={views30} />
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs uppercase tracking-wide text-faint">
            Son 14 gün
          </div>
          <div className="mt-3 flex h-28 items-end gap-1.5">
            {chart.map((x) => (
              <div
                key={key(x.date)}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${x.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: "UTC" })}: ${x.count}`}
              >
                <div
                  className="w-full rounded-t bg-green"
                  style={{ height: `${(x.count / maxC) * 88}px`, minHeight: x.count > 0 ? "3px" : "0" }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-faint">
            <span>
              {chart[0]?.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: "UTC" })}
            </span>
            <span>bugün</span>
          </div>
          {views30 === 0 && (
            <p className="mt-3 text-xs text-faint">
              Henüz görüntülenme yok. QR kodunu paylaştıkça buraya yansıyacak.
            </p>
          )}
        </div>
      </div>

      {/* Sonraki adımlar */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Kuruluma başla</h2>
        <ol className="mt-4 space-y-3 text-sm">
          <Step done title="Hesabını oluşturdun" />
          <Step
            title="Menünü oluştur"
            hint={`${trialDaysLeft(business)} günlük denemende kategori ve ürünlerini ekle`}
          />
          <Step title="QR kodunu indir ve masaya koy" />
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/menu"
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Menüyü oluştur
          </Link>
          <Link
            href="/dashboard/qr"
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            QR kodu gör
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-1.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Step({
  title,
  hint,
  done,
}: {
  title: string;
  hint?: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
          done ? "bg-green text-black" : "border border-border text-faint"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div>
        <div className={done ? "text-muted line-through" : "font-medium"}>
          {title}
        </div>
        {hint && <div className="text-xs text-faint">{hint}</div>}
      </div>
    </li>
  );
}
