import type { Metadata } from "next";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import { prisma } from "@/lib/db";
import { listBusinessOrders, listServiceRequests } from "@/lib/orders/service";
import { OrdersPanel } from "./orders-panel";

export const metadata: Metadata = { title: "Siparişler" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { business } = await requireOrderingBusiness();
  const [orders, serviceRequests, settings] = await Promise.all([
    listBusinessOrders(business.id),
    listServiceRequests(business.id),
    prisma.orderSettings.findUnique({
      where: { businessId: business.id },
      select: { soundEnabled: true, prepWarnMins: true },
    }),
  ]);

  return (
    <OrdersPanel
      initialOrders={orders}
      initialRequests={serviceRequests}
      soundDefault={settings?.soundEnabled ?? true}
      prepWarnMins={settings?.prepWarnMins ?? 15}
    />
  );
}
