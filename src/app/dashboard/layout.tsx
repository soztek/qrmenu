import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { logoutAction } from "@/lib/actions/auth";
import {
  getPlan,
  planHasFeature,
  PLANS,
  type Feature,
  type PlanId,
} from "@/lib/plans";

/** Bir özelliğin açıldığı en düşük paketin adı (ör. orders → "Pro"). */
function featurePlanName(feature: Feature): string | null {
  return PLANS.find((p) => p.features.includes(feature))?.name ?? null;
}
import { statusLabel, hasActiveAccess } from "@/lib/subscription";
import { Logo } from "@/components/logo";

interface NavItem {
  href: string;
  label: string;
  feature?: Feature; // paket kilidi
  soon?: boolean; // henüz yapılmadı
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Genel bakış" },
  { href: "/dashboard/menu", label: "Menü" },
  { href: "/dashboard/reviews", label: "Yorumlar" },
  { href: "/dashboard/qr", label: "QR Kod" },
  { href: "/dashboard/orders", label: "Siparişler", feature: "orders", soon: true },
  { href: "/dashboard/tables", label: "Masalar", feature: "tables", soon: true },
  { href: "/dashboard/abonelik", label: "Abonelik" },
  { href: "/dashboard/settings", label: "Ayarlar" },
];

function Brand({ short = false }: { short?: boolean }) {
  return <Logo href="/dashboard" className={short ? "h-8" : "h-9"} />;
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          compact
            ? "rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:border-orange/50 hover:text-fg"
            : "w-full rounded-lg border border-border py-2 text-sm text-muted transition hover:border-orange/50 hover:text-fg"
        }
      >
        Çıkış
      </button>
    </form>
  );
}

/** Nav bağlantıları — kenar çubuğu (dikey) ve mobil (yatay) için ortak. */
function NavLinks({
  plan,
  orientation,
}: {
  plan: PlanId;
  orientation: "vertical" | "horizontal";
}) {
  const wrap =
    orientation === "vertical"
      ? "space-y-1"
      : "flex gap-2 overflow-x-auto pb-1";

  return (
    <div className={wrap}>
      {NAV.map((item) => {
        const locked = item.feature ? !planHasFeature(plan, item.feature) : false;
        const disabled = item.soon || locked;
        const reqPlan = item.feature ? featurePlanName(item.feature) : null;
        const base =
          orientation === "vertical"
            ? "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition"
            : "shrink-0 rounded-lg px-3 py-1.5 text-sm transition";

        if (disabled) {
          return (
            <span
              key={item.href}
              className={`${base} cursor-not-allowed whitespace-nowrap text-faint`}
              title={reqPlan ? `${reqPlan} paketi ile açılır` : undefined}
            >
              {item.label}
              {orientation === "vertical" && reqPlan && (
                <span className="rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-semibold text-green">
                  {reqPlan}
                </span>
              )}
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${base} whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect(isAdmin(user) ? "/admin" : "/kayit");

  const business = user.business;
  const plan = getPlan(business.plan);
  const active = hasActiveAccess(business);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobil üst bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Brand short />
        <LogoutButton compact />
      </header>

      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="px-2 py-1">
          <Brand />
        </div>
        <nav className="mt-6 flex-1">
          <NavLinks plan={business.plan} orientation="vertical" />
        </nav>
        <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs">
          <div className="font-medium text-fg">{business.name}</div>
          <div className="mt-0.5 text-faint">{plan.name} paketi</div>
          <div className={`mt-1 ${active ? "text-green" : "text-orange"}`}>
            {statusLabel(business)}
          </div>
        </div>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil nav şeridi */}
        <div className="border-b border-border bg-surface/60 px-4 py-2 md:hidden">
          <NavLinks plan={business.plan} orientation="horizontal" />
        </div>

        {/* Deneme / abonelik bandı */}
        {business.subscriptionStatus === "trialing" && (
          <div className="border-b border-border bg-gradient-to-r from-green-soft to-orange-soft px-6 py-2.5 text-sm">
            <span className="text-fg">{statusLabel(business)}.</span>{" "}
            <Link href="/dashboard/abonelik" className="font-medium text-green hover:underline">
              Paketi yükselt →
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
