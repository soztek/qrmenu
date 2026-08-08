import type { Metadata } from "next";
import Link from "next/link";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import { getReports } from "@/lib/orders/reports";

export const metadata: Metadata = { title: "Raporlar" };
export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

const RANGES = [
  { key: "today", label: "Bugün", days: 1 },
  { key: "7", label: "Son 7 gün", days: 7 },
  { key: "30", label: "Son 30 gün", days: 30 },
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className={`text-2xl font-extrabold ${tone ?? "text-fg"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { business } = await requireOrderingBusiness();
  const sp = await searchParams;
  const range = RANGES.find((r) => r.key === sp.range) ?? RANGES[1];
  const rep = await getReports(business.id, range.days);

  const maxQty = Math.max(1, ...rep.topItems.map((t) => t.qty));
  const maxTable = Math.max(1, ...rep.byTable.map((t) => t.total));
  const maxDaily = Math.max(1, ...rep.daily.map((d) => d.total));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Raporlar</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/dashboard/raporlar?range=${r.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                range.key === r.key ? "bg-fg text-bg" : "border border-border text-muted hover:text-fg"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Sipariş" value={String(rep.count)} />
        <Stat label="Ciro" value={fmt(rep.revenue)} tone="text-green" />
        <Stat label="Ort. sipariş" value={fmt(rep.avg)} />
        <Stat label="Tahsil edilen" value={fmt(rep.collected)} tone="text-green" />
        <Stat label="İptal/Red" value={String(rep.cancelled)} tone="text-orange" />
      </div>

      {/* Günlük ciro */}
      {range.days > 1 && (
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm font-semibold text-fg">Günlük ciro</div>
          <div className="mt-4 flex h-40 items-end gap-1">
            {rep.daily.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${fmt(d.total)}`}>
                <div
                  className="w-full rounded-t bg-green/70"
                  style={{ height: `${Math.max(2, (d.total / maxDaily) * 100)}%` }}
                />
                {range.days <= 7 && (
                  <span className="text-[9px] text-faint">{d.date.slice(8, 10)}.{d.date.slice(5, 7)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En çok satılan ürünler */}
      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="text-sm font-semibold text-fg">En çok satılan ürünler</div>
        {rep.topItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Bu dönemde satış yok.</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {rep.topItems.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-fg">{t.name}</span>
                  <span className="shrink-0 pl-2 text-muted">
                    <strong className="text-fg">{t.qty}</strong> adet · {fmt(t.revenue)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-green to-green-dark" style={{ width: `${(t.qty / maxQty) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Masa bazlı satış */}
      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="text-sm font-semibold text-fg">Masa bazlı satış</div>
        {rep.byTable.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Veri yok.</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {rep.byTable.map((t) => (
              <div key={t.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-fg">{t.label}</span>
                  <span className="shrink-0 pl-2 text-muted">
                    {t.count} sipariş · <strong className="text-fg">{fmt(t.total)}</strong>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-orange/70" style={{ width: `${(t.total / maxTable) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-faint">
        Raporlar yalnızca bu işletmenin verilerinden hesaplanır. İptal/red edilen siparişler ciroya dahil edilmez.
      </p>
    </div>
  );
}
