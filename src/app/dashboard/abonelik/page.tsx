import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, formatPrice, type PlanId } from "@/lib/plans";
import { statusLabel } from "@/lib/subscription";
import { priceForTL } from "@/lib/paytr";

export const metadata: Metadata = { title: "Abonelik" };
export const dynamic = "force-dynamic";

function trDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function AbonelikPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;
  const b = user.business;

  const accessEnd =
    b.subscriptionStatus === "active" ? b.currentPeriodEnd : b.trialEndsAt;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Abonelik</h1>
      <p className="mt-1 text-muted">
        Paketini seç, güvenli ödemeyle (PayTR) erişimini uzat.
      </p>

      {/* Mevcut durum */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Mevcut paket" value={PLANS.find((p) => p.id === b.plan)?.name ?? "—"} />
        <Stat label="Durum" value={statusLabel(b)} />
        <Stat label="Erişim bitişi" value={trDate(accessEnd)} />
      </div>

      {/* Paketler */}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.id === b.plan && b.subscriptionStatus === "active";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${
                p.popular ? "border-green" : "border-border"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-green px-3 py-1 text-xs font-semibold text-black">
                  En popüler
                </span>
              )}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="text-sm text-muted">{p.tagline}</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold">
                  {formatPrice(p.priceMonthly)}
                </span>
                <span className="text-sm text-faint"> / ay</span>
              </div>
              <p className="mt-1 text-xs text-faint">
                Yıllık: {formatPrice(priceForTL(p.id as PlanId, "yearly"))}{" "}
                <span className="text-green">(2 ay hediye)</span>
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-green">✓</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href={`/dashboard/abonelik/odeme?plan=${p.id}&period=monthly`}
                  className={`rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.popular
                      ? "bg-green text-black hover:bg-green-dark"
                      : "border border-border text-fg hover:border-green/50"
                  }`}
                >
                  {current ? "Süreyi uzat (aylık)" : "Aylık al"}
                </Link>
                <Link
                  href={`/dashboard/abonelik/odeme?plan=${p.id}&period=yearly`}
                  className="rounded-lg border border-border px-4 py-2 text-center text-xs text-muted transition hover:border-green/50 hover:text-fg"
                >
                  Yıllık al · {formatPrice(priceForTL(p.id as PlanId, "yearly"))}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-faint">
        Ödemeler PayTR / iyzico güvenli altyapısı ile alınır. Tek seferlik ödeme yaparsın;
        süre bitmeden hatırlatma göndeririz. Kartın bizde saklanmaz.
      </p>
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
