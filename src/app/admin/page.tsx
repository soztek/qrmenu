import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { statusLabel } from "@/lib/subscription";

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
