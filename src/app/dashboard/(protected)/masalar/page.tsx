import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import { prisma } from "@/lib/db";
import { businessTableUrl } from "@/lib/url";
import { TablesClient } from "./tables-client";

export const metadata: Metadata = { title: "Masalar" };

export default async function TablesPage() {
  const { business } = await requireOrderingBusiness();

  const tables = await prisma.restaurantTable.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true, qrToken: true, active: true },
  });

  const withQr = await Promise.all(
    tables.map(async (t) => {
      const orderUrl = businessTableUrl(business, t.qrToken);
      const qr = await QRCode.toDataURL(orderUrl, {
        width: 240,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      return { id: t.id, label: t.label, active: t.active, orderUrl, qr };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Masalar</h1>
      <p className="mt-1 text-muted">
        Her masaya özel, güvenli bir QR kod üretilir. Müşteri okuttuğunda masa otomatik
        belirlenir ve sipariş verebilir.
      </p>

      <TablesClient tables={withQr} slug={business.slug} />
    </div>
  );
}
