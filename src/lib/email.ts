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

export type SendResult = { ok: boolean; error?: string; id?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("E-posta yapılandırılmamış (RESEND_API_KEY/EMAIL_FROM yok):", opts.subject);
    return { ok: false, error: "E-posta yapılandırılmamış (RESEND_API_KEY/EMAIL_FROM eksik)." };
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
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("Resend hatası:", res.status, body.slice(0, 300));
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    let id: string | undefined;
    try {
      id = JSON.parse(body)?.id;
    } catch {}
    return { ok: true, id };
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
    return { ok: false, error: String(err) };
  }
}

const fmtTL = (kurus: number) =>
  "₺" + (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const SITE = "https://www.soztekqrmenu.com.tr";
const LOGO = `${SITE}/logo.jpg`;

const trDate = (d: Date) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(d);

/** Tüm maillerde ortak marka çerçevesi (logolu header + iletişim footer). */
function emailLayout(inner: string): string {
  return `
  <div style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#ffffff;padding:18px 24px;text-align:center;border-bottom:3px solid #22c55e">
        <img src="${LOGO}" alt="Söztek QR Menü" height="42" style="height:42px;width:auto;display:inline-block" />
      </div>
      <div style="padding:24px">
        ${inner}
      </div>
      <div style="padding:0 24px 24px">
        <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;border-top:1px solid #eee;padding-top:14px">
          Bu e-posta ${COMPANY.legalName} tarafından gönderildi.<br/>
          ${COMPANY.phone} · ${COMPANY.gsm} · ${COMPANY.email}<br/>
          <a href="${SITE}" style="color:#16a34a;text-decoration:none">www.soztekqrmenu.com.tr</a>
        </p>
      </div>
    </div>
  </div>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#22c55e;color:#0a0a0b;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px">${label}</a>`;

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
  const end = trDate(p.periodEnd);
  const now = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  const subject = `Ödemeniz alındı — ${planName} paketi · ${COMPANY.shortName}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;font-size:14px">${value}</td></tr>`;

  const html = emailLayout(`
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
    ${button(`${SITE}/dashboard`, "Panele git")}
    <p style="margin:18px 0 0;color:#9ca3af;font-size:12px">
      Kart bilgileriniz saklanmaz; ödemeler güvenli altyapı üzerinden alınır.
    </p>`);

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

const waLink = () => `https://wa.me/${COMPANY.gsmRaw.replace(/\D/g, "")}`;

/** Söztek yöneticisine yeni işletme kaydı bildirimi. */
export function newSignupNoticeEmail(p: {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  plan: PlanId;
  trialEndsAt: Date;
}): { subject: string; html: string } {
  const now = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
  return {
    subject: `🆕 Yeni kayıt: ${p.businessName}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;line-height:1.6">
      <p><b>${p.businessName}</b> Söztek QR Menü'ye kayıt oldu ve 7 günlük denemeye başladı.</p>
      <p>
        Yetkili: <b>${p.ownerName}</b><br/>
        E-posta: ${p.ownerEmail}<br/>
        Seçilen paket: <b>${getPlan(p.plan).name}</b><br/>
        Deneme bitişi: ${trDate(p.trialEndsAt)}<br/>
        Kayıt zamanı: ${now}
      </p>
      <p><a href="${SITE}/admin/businesses" style="color:#16a34a;text-decoration:none;font-weight:600">Admin panelinde gör →</a></p>
    </div>`,
  };
}

/** Yeni kayıt olan işletmeye karşılama + platformda neler yapabileceği. */
export function welcomeEmail(p: {
  businessName: string;
  trialEndsAt: Date;
}): { subject: string; html: string } {
  const feat = (title: string, desc: string) =>
    `<tr>
      <td style="padding:10px 0;vertical-align:top;width:26px;font-size:18px">✅</td>
      <td style="padding:10px 0;vertical-align:top">
        <div style="font-weight:700;color:#111827;font-size:14px">${title}</div>
        <div style="color:#6b7280;font-size:13px;line-height:1.5">${desc}</div>
      </td>
    </tr>`;

  const html = emailLayout(`
    <h1 style="margin:0 0 6px;font-size:22px;color:#111827">Aramıza hoş geldiniz! 🎉</h1>
    <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6">
      Merhaba <b>${p.businessName}</b>, Söztek QR Menü ailesine katıldığınız için teşekkür ederiz.
      <b>${trDate(p.trialEndsAt)}</b> tarihine kadar sürecek <b>7 günlük ücretsiz denemeniz</b> başladı —
      tüm özellikleri özgürce keşfedebilirsiniz.
    </p>
    <div style="font-weight:700;color:#111827;font-size:15px;margin:6px 0 2px">Panelde neler yapabilirsiniz?</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
      ${feat("Dijital menünüzü oluşturun", "Kategoriler, fotoğraflı ürünler, fiyatlar ve açıklamalar. Sınırsız ürün ekleyin.")}
      ${feat("Anında güncelleyin", "Fiyat veya ürün değişince menü aynı anda güncellenir; yeniden baskı yok.")}
      ${feat("QR kodunuzu indirin", "QR'ı masalara veya standlara koyun; müşteri telefonuyla okutup menüyü görsün.")}
      ${feat("Sipariş & mutfak paneli (Pro)", "Müşteriden QR ile sipariş alın, canlı mutfak panelinden takip edin.")}
      ${feat("İşletme vitrininizi tamamlayın", "Çalışma saatleri, WhatsApp, konum, Wi-Fi ve müşteri yorumları.")}
    </table>
    <div style="margin:18px 0 6px">${button(`${SITE}/dashboard`, "Menümü oluşturmaya başla")}</div>
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.6">
      Kurulumda takıldığınız bir yer olursa yalnız değilsiniz —
      <a href="${waLink()}" style="color:#16a34a;text-decoration:none;font-weight:600">WhatsApp'tan yazın</a>
      ya da ${COMPANY.gsm} numarasından bize ulaşın. Menünüzü birlikte hazırlamaktan memnuniyet duyarız.
    </p>`);

  return { subject: `Hoş geldiniz — QR menünüz hazır olmaya çok yakın 🎉`, html };
}

/** Deneme bitişine ~1 gün kala gönderilen hatırlatma + destek teklifi. */
export function trialReminderEmail(p: {
  businessName: string;
  trialEndsAt: Date;
}): { subject: string; html: string } {
  const html = emailLayout(`
    <h1 style="margin:0 0 6px;font-size:20px;color:#111827">Denemeniz yarın sona eriyor ⏳</h1>
    <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6">
      Merhaba <b>${p.businessName}</b>, 7 günlük ücretsiz deneme süreniz
      <b>${trDate(p.trialEndsAt)}</b> tarihinde doluyor. Menünüzün ve QR kodunuzun
      kesintisiz yayında kalması için size uygun paketi seçmeniz yeterli.
    </p>
    <div style="margin:6px 0 14px">${button(`${SITE}/dashboard/abonelik`, "Paketimi seç")}</div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:6px">
      <div style="font-weight:700;color:#166534;font-size:14px;margin-bottom:4px">Yardıma mı ihtiyacınız var?</div>
      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6">
        Menünüzü henüz tamamlayamadıysanız veya takıldığınız bir yer varsa,
        biz buradayız. <a href="${waLink()}" style="color:#15803d;text-decoration:none;font-weight:700">WhatsApp'tan yazın</a>
        ya da ${COMPANY.gsm} numarasından arayın — menünüzü birlikte hazırlayıp
        yayına almanıza yardımcı olalım. Hiçbir sorunuz küçük değil. 🙂
      </p>
    </div>
    <p style="margin:14px 0 0;color:#9ca3af;font-size:12px">
      Zaten paket satın aldıysanız bu mesajı yok sayabilirsiniz.
    </p>`);

  return { subject: `Denemeniz yarın bitiyor — yardımcı olalım mı?`, html };
}
