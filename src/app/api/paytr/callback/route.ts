import { prisma } from "@/lib/db";
import { verifyCallback } from "@/lib/paytr";

export const runtime = "nodejs";

/**
 * PayTR bildirim (callback) ucu. PayTR ödeme sonucunu buraya POST eder.
 * Hash doğrulanır; başarılıysa abonelik uzatılır. PayTR'nin tekrar denememesi
 * için düz metin "OK" dönmek ZORUNLU.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const merchantOid = String(form.get("merchant_oid") ?? "");
  const status = String(form.get("status") ?? "");
  const totalAmount = String(form.get("total_amount") ?? "");
  const hash = String(form.get("hash") ?? "");

  if (!merchantOid || !verifyCallback(merchantOid, status, totalAmount, hash)) {
    return new Response("PAYTR notification failed: bad hash", { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { merchantOid },
  });
  // Bilinmeyen ya da zaten işlenmiş → tekrar denemeyi durdurmak için OK
  if (!payment || payment.status === "success") return new Response("OK");

  if (status === "success") {
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
  } else {
    await prisma.payment.update({
      where: { merchantOid },
      data: { status: "failed" },
    });
  }

  return new Response("OK");
}
