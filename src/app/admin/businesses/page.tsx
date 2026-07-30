import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { statusLabel } from "@/lib/subscription";
import { BusinessActions } from "./business-actions";

export const metadata: Metadata = { title: "Admin — İşletmeler" };
export const dynamic = "force-dynamic";

function trDateTime(d: Date): string {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function accessEnd(b: {
  subscriptionStatus: string;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
}): string {
  const d = b.subscriptionStatus === "active" ? b.currentPeriodEnd : b.trialEndsAt;
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBusinesses({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const businesses = await prisma.business.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { owner: { email: { contains: query, mode: "insensitive" } } },
            { owner: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      createdAt: true,
      owner: { select: { id: true, email: true, name: true } },
      _count: { select: { categories: true, menuItems: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">İşletmeler</h1>
      <p className="mt-1 text-muted">
        {query ? (
          <>
            &ldquo;{query}&rdquo; için {businesses.length} sonuç.
          </>
        ) : (
          <>
            Toplam {businesses.length} işletme. Süreyi uzatabilir, paket ve
            durumu değiştirebilir, işletmeyi silebilirsin.
          </>
        )}
      </p>

      {/* Arama */}
      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="İşletme adı, /m slug veya e-posta ara…"
          className="w-full max-w-sm rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Ara
        </button>
        {query && (
          <a
            href="/admin/businesses"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-green/50 hover:text-fg"
          >
            Temizle
          </a>
        )}
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3">İşletme</th>
              <th className="px-4 py-3">Sahip</th>
              <th className="px-4 py-3">Kayıt tarihi</th>
              <th className="px-4 py-3">Menü</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Süre sonu</th>
              <th className="px-4 py-3">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {businesses.map((b) => (
              <tr key={b.id} className="bg-surface/40 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-faint">/m/{b.slug}</div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                    <a
                      href={`/m/${b.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green hover:underline"
                    >
                      Menü ↗
                    </a>
                    <a
                      href={`/yazdir?b=${b.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green hover:underline"
                    >
                      PDF menü ↗
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  <div>{b.owner?.email ?? "—"}</div>
                  {b.owner?.name && (
                    <div className="text-xs text-faint">{b.owner.name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-faint">{trDateTime(b.createdAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {b._count.categories} kategori · {b._count.menuItems} ürün
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      b.subscriptionStatus === "active"
                        ? "text-green"
                        : b.subscriptionStatus === "trialing"
                          ? "text-fg"
                          : "text-orange"
                    }
                  >
                    {statusLabel(b)}
                  </span>
                  <div className="text-xs text-faint">{getPlan(b.plan).name}</div>
                </td>
                <td className="px-4 py-3 text-faint">{accessEnd(b)}</td>
                <td className="px-4 py-3">
                  <BusinessActions
                    businessId={b.id}
                    businessName={b.name}
                    plan={b.plan}
                    status={b.subscriptionStatus}
                    ownerId={b.owner?.id ?? null}
                  />
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-faint">
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
