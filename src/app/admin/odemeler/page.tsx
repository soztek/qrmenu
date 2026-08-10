import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { DeletePaymentButton } from "./payment-actions";

export const metadata: Metadata = { title: "Ödemeler" };

const fmt = (kurus: number) =>
  "₺" + (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const STATUS_TABS = [
  { key: "all", label: "Tümü" },
  { key: "success", label: "Başarılı" },
  { key: "pending", label: "Bekleyen" },
  { key: "failed", label: "Başarısız" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  success: { label: "Başarılı", cls: "bg-green-soft text-green" },
  pending: { label: "Bekliyor", cls: "bg-surface-2 text-muted" },
  failed: { label: "Başarısız", cls: "bg-orange-soft text-orange" },
};

function dt(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUS_TABS.some((t) => t.key === sp.status && t.key !== "all")
    ? sp.status!
    : "all";

  const [payments, agg, monthAgg] = await Promise.all([
    prisma.payment.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { business: { select: { name: true, slug: true } } },
    }),
    prisma.payment.aggregate({ where: { status: "success" }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({
      where: { status: "success", paidAt: { gte: startOfMonth() } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = agg._sum.amount ?? 0;
  const monthRevenue = monthAgg._sum.amount ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg">Ödemeler</h1>
      <p className="mt-1 text-sm text-muted">
        İşletmelerin paket (abonelik) satın alımları ve ödeme durumları.
      </p>

      {/* Özet */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-2xl font-extrabold text-green">{fmt(totalRevenue)}</div>
          <div className="text-xs text-muted">Toplam tahsilat</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-2xl font-extrabold text-fg">{agg._count}</div>
          <div className="text-xs text-muted">Başarılı ödeme</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-2xl font-extrabold text-green">{fmt(monthRevenue)}</div>
          <div className="text-xs text-muted">Bu ay</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-2xl font-extrabold text-fg">{monthAgg._count}</div>
          <div className="text-xs text-muted">Bu ayki ödeme</div>
        </div>
      </div>

      {/* Filtre */}
      <div className="mt-5 flex gap-2">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/odemeler" : `/admin/odemeler?status=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              status === t.key ? "bg-fg text-bg" : "border border-border text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      {payments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Henüz ödeme kaydı yok.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-faint">
              <tr>
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Sağlayıcı</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const meta = STATUS_META[p.status] ?? STATUS_META.pending;
                return (
                  <tr key={p.id} className="bg-surface/40">
                    <td className="px-4 py-3 font-medium text-fg">
                      {p.business?.name ?? "—"}
                      {p.business?.slug && (
                        <span className="block text-xs text-faint">/m/{p.business.slug}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{getPlan(p.plan).name}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.period === "yearly" ? "Yıllık" : "Aylık"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-fg">{fmt(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-faint">{p.provider}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {dt(p.paidAt ?? p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "success" && <DeletePaymentButton id={p.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
