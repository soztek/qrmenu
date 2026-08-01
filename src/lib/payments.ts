import { prisma } from "@/lib/db";
import { paytrConfig } from "@/lib/paytr";
import { iyzicoConfig } from "@/lib/iyzico";

export type Provider = "paytr" | "iyzico";

/**
 * Aktif ödeme sağlayıcısı. PAYMENT_PROVIDER env'i açıkça belirtilmişse onu,
 * yoksa yapılandırılmış olanı (önce PayTR, sonra iyzico) döner. Hiçbiri
 * yapılandırılmamışsa null (ödeme kapalı).
 */
export function activeProvider(): Provider | null {
  const explicit = process.env.PAYMENT_PROVIDER;
  if (explicit === "paytr") return paytrConfig() ? "paytr" : null;
  if (explicit === "iyzico") return iyzicoConfig() ? "iyzico" : null;
  if (paytrConfig()) return "paytr";
  if (iyzicoConfig()) return "iyzico";
  return null;
}

/** Ödemeyi başarılı işaretle ve aboneliği uzat (idempotent). */
export async function grantSubscription(merchantOid: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { merchantOid } });
  if (!payment || payment.status === "success") return;

  const biz = await prisma.business.findUnique({
    where: { id: payment.businessId },
    select: { currentPeriodEnd: true },
  });
  const base = Math.max(
    Date.now(),
    biz?.currentPeriodEnd ? new Date(biz.currentPeriodEnd).getTime() : 0,
  );
  const newEnd = new Date(base + payment.days * 86_400_000);

  await prisma.$transaction([
    prisma.payment.update({
      where: { merchantOid },
      data: { status: "success", paidAt: new Date() },
    }),
    prisma.business.update({
      where: { id: payment.businessId },
      data: {
        plan: payment.plan,
        subscriptionStatus: "active",
        currentPeriodEnd: newEnd,
      },
    }),
  ]);
}

/** Bekleyen ödemeyi başarısız işaretle. */
export async function markFailed(merchantOid: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { merchantOid, status: "pending" },
    data: { status: "failed" },
  });
}
