import { prisma } from "@/lib/db";
import { paytrConfig } from "@/lib/paytr";
import { iyzicoConfig } from "@/lib/iyzico";
import { sendEmail, paymentReceiptEmail, saleNoticeEmail } from "@/lib/email";
import type { PlanId } from "@/lib/plans";

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
    select: { name: true, currentPeriodEnd: true, owner: { select: { email: true } } },
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

  // Ödeme onay e-postası (başarısız gönderim ödemeyi etkilemez).
  await sendPaymentEmails(payment, biz, newEnd).catch((e) =>
    console.error("Ödeme maili gönderilemedi:", e),
  );
}

/** İşletmeye onay + yöneticiye satış bildirimi maili. */
async function sendPaymentEmails(
  payment: { plan: PlanId; amount: number; period: string; merchantOid: string },
  biz: { name: string; owner: { email: string } | null } | null,
  newEnd: Date,
): Promise<void> {
  const email = biz?.owner?.email;
  if (!biz || !email) return;

  const reference = payment.merchantOid.slice(0, 12).toUpperCase();
  const receipt = paymentReceiptEmail({
    businessName: biz.name,
    plan: payment.plan,
    amountKurus: payment.amount,
    period: payment.period,
    periodEnd: newEnd,
    reference,
  });
  await sendEmail({ to: email, subject: receipt.subject, html: receipt.html });

  // Söztek yöneticisine satış bildirimi (ADMIN_EMAILS ilk adres).
  const admin = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (admin && admin !== email) {
    const notice = saleNoticeEmail({
      businessName: biz.name,
      plan: payment.plan,
      amountKurus: payment.amount,
      ownerEmail: email,
    });
    await sendEmail({ to: admin, subject: notice.subject, html: notice.html });
  }
}

/** Bekleyen ödemeyi başarısız işaretle. */
export async function markFailed(merchantOid: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { merchantOid, status: "pending" },
    data: { status: "failed" },
  });
}
