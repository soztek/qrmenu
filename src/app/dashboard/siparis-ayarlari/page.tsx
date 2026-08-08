import type { Metadata } from "next";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import { prisma } from "@/lib/db";
import { OrderSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Sipariş Ayarları" };

export default async function OrderSettingsPage() {
  const { business } = await requireOrderingBusiness();

  const s = await prisma.orderSettings.findUnique({
    where: { businessId: business.id },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Sipariş Ayarları</h1>
      <p className="mt-1 mb-5 text-muted">
        Masadan sipariş sistemini buradan yönetin. Kapalıyken QR menü normal dijital menü
        olarak çalışmaya devam eder.
      </p>

      <OrderSettingsForm
        initial={{
          qrOrderingEnabled: s?.qrOrderingEnabled ?? false,
          acceptMode: (s?.acceptMode as "staff" | "auto") ?? "staff",
          callWaiterEnabled: s?.callWaiterEnabled ?? true,
          requestBillEnabled: s?.requestBillEnabled ?? true,
          askCustomerName: s?.askCustomerName ?? false,
          allowNotes: s?.allowNotes ?? true,
          stockControl: s?.stockControl ?? true,
          soundEnabled: s?.soundEnabled ?? true,
          kitchenEnabled: s?.kitchenEnabled ?? true,
          minOrderTotal: s?.minOrderTotal != null ? String(Number(s.minOrderTotal)) : "",
          acceptFrom: s?.acceptFrom ?? "",
          acceptTo: s?.acceptTo ?? "",
          prepWarnMins: s?.prepWarnMins ?? 15,
        }}
      />
    </div>
  );
}
