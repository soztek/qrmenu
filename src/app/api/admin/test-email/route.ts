import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { sendEmail, paymentReceiptEmail, isEmailConfigured } from "@/lib/email";

/**
 * Admin'e özel tanı endpoint'i: giriş yapan admin'in kendi e-postasına
 * örnek bir "Ödemeniz alındı" maili gönderir. Env + domain + şablonu
 * gerçek satın alım yapmadan uçtan uca doğrular.
 * Kullanım: admin olarak giriş yapıp /api/admin/test-email adresini aç.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 403 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "E-posta yapılandırılmamış: RESEND_API_KEY / EMAIL_FROM eksik (Vercel env + redeploy?)." },
      { status: 400 },
    );
  }

  const { subject, html } = paymentReceiptEmail({
    businessName: "Test İşletmesi",
    plan: "pro",
    amountKurus: 19900,
    period: "monthly",
    periodEnd: new Date(Date.now() + 30 * 86_400_000),
    reference: "TEST-" + Date.now().toString(36).toUpperCase(),
  });

  const result = await sendEmail({ to: user.email, subject: `[TEST] ${subject}`, html });

  return NextResponse.json(
    { to: user.email, ...result },
    { status: result.ok ? 200 : 500 },
  );
}
