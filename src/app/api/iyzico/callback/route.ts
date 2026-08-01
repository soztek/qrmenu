import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrieveIyzicoResult } from "@/lib/iyzico";
import { grantSubscription, markFailed } from "@/lib/payments";

export const runtime = "nodejs";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.soztekqrmenu.com.tr";

/**
 * iyzico Checkout Form dönüş ucu. iyzico ödeme sonrası tarayıcıyı buraya POST
 * eder (token ile). Sonucu API'den doğrulayıp aboneliği uzatır, kullanıcıyı
 * başarılı/başarısız sayfasına yönlendirir.
 */
export async function POST(req: Request) {
  const ok = `${APP_URL}/dashboard/abonelik/basarili`;
  const fail = `${APP_URL}/dashboard/abonelik/basarisiz`;

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "");
  } catch {
    /* gövde yok */
  }
  if (!token) return NextResponse.redirect(fail, 303);

  const { paid, conversationId } = await retrieveIyzicoResult(token);

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ providerRef: token }, { merchantOid: conversationId ?? "__none__" }],
    },
    select: { merchantOid: true },
  });

  if (paid && payment) {
    await grantSubscription(payment.merchantOid);
    return NextResponse.redirect(ok, 303);
  }
  if (payment) await markFailed(payment.merchantOid);
  return NextResponse.redirect(fail, 303);
}
