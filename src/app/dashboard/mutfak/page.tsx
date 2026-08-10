import type { Metadata } from "next";
import Link from "next/link";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import { prisma } from "@/lib/db";
import { listBusinessOrders } from "@/lib/orders/service";
import { KitchenScreen } from "./kitchen-screen";

export const metadata: Metadata = { title: "Mutfak" };
export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const { business } = await requireOrderingBusiness();
  const [orders, settings] = await Promise.all([
    listBusinessOrders(business.id),
    prisma.orderSettings.findUnique({
      where: { businessId: business.id },
      select: { prepWarnMins: true, kitchenEnabled: true },
    }),
  ]);

  if (settings && !settings.kitchenEnabled) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="text-4xl">🍳</div>
        <h1 className="mt-3 text-xl font-bold text-fg">Mutfak ekranı kapalı</h1>
        <p className="mt-2 text-sm text-muted">
          Sipariş Ayarları&apos;ndan &quot;Mutfak ekranı&quot; seçeneğini açabilirsiniz.
        </p>
        <Link
          href="/dashboard/siparis-ayarlari"
          className="mt-4 inline-block rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black"
        >
          Sipariş Ayarları
        </Link>
      </div>
    );
  }

  return <KitchenScreen initialOrders={orders} prepWarnMins={settings?.prepWarnMins ?? 15} />;
}
