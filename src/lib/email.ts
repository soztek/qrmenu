import "server-only";
import { COMPANY } from "@/lib/company";
import { getPlan, type PlanId } from "@/lib/plans";

/**
 * E-posta gönderimi — Resend (fetch, bağımlılıksız).
 * RESEND_API_KEY + EMAIL_FROM tanımlı değilse sessizce no-op (loglar).
 * Hiçbir zaman throw etmez — ödeme akışını bozmaz.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("E-posta yapılandırılmamış (RESEND_API_KEY/EMAIL_FROM yok):", opts.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend hatası:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
    return false;
  }
}

const fmtTL = (kurus: number) =>
  "₺" + (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** İşletmeye gönderilecek ödeme onay/fatura e-postası. */
export function paymentReceiptEmail(p: {
  businessName: string;
  plan: PlanId;
  amountKurus: number;
  period: string;
  periodEnd: Date;
  reference: string;
}): { subject: string; html: string } {
  const planName = getPlan(p.plan).name;
  const periodLabel = p.period === "yearly" ? "Yıllık" : "Aylık";
  const end = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(p.periodEnd);
  const now = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const subject = `Ödemeniz alındı — ${planName} paketi · ${COMPANY.shortName}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;font-size:14px">${value}</td></tr>`;

  const html = `
  <div style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0a0a0b;padding:22px 24px">
        <div style="color:#22c55e;font-weight:800;font-size:18px">Söztek QR Menü</div>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 6px;font-size:20px;color:#111827">Ödemeniz alındı ✅</h1>
        <p style="margin:0 0 18px;color:#4b5563;font-size:14px">
          Merhaba <b>${p.businessName}</b>, <b>${planName}</b> paketi aboneliğiniz başarıyla etkinleştirildi. Teşekkür ederiz!
        </p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin-bottom:18px">
          ${row("Paket", planName)}
          ${row("Dönem", periodLabel)}
          ${row("Tutar", fmtTL(p.amountKurus))}
          ${row("Ödeme tarihi", now)}
          ${row("Geçerlilik", end + "'e kadar")}
          ${row("Referans", p.reference)}
        </table>
        <a href="https://www.soztekqrmenu.com.tr/dashboard" style="display:inline-block;background:#22c55e;color:#0a0a0b;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px">Panele git</a>
        <p style="margin:18px 0 0;color:#9ca3af;font-size:12px">
          Bu e-posta ${COMPANY.legalName} tarafından gönderildi.<br/>
          ${COMPANY.phone} · ${COMPANY.gsm} · ${COMPANY.email}<br/>
          Kart bilgileriniz saklanmaz; ödemeler güvenli altyapı üzerinden alınır.
        </p>
      </div>
    </div>
  </div>`;

  return { subject, html };
}

/** Söztek yöneticisine kısa satış bildirimi. */
export function saleNoticeEmail(p: {
  businessName: string;
  plan: PlanId;
  amountKurus: number;
  ownerEmail: string;
}): { subject: string; html: string } {
  const planName = getPlan(p.plan).name;
  return {
    subject: `💰 Yeni satış: ${p.businessName} — ${planName} (${fmtTL(p.amountKurus)})`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827">
      <p><b>${p.businessName}</b> işletmesi <b>${planName}</b> paketini satın aldı.</p>
      <p>Tutar: <b>${fmtTL(p.amountKurus)}</b><br/>İşletme e-postası: ${p.ownerEmail}</p>
    </div>`,
  };
}
