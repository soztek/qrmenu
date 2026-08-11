import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, trialReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Günlük cron: deneme süresi ~1 gün içinde bitecek işletmelere hatırlatma maili.
 * Vercel Cron çağrısı `Authorization: Bearer <CRON_SECRET>` ile doğrulanır.
 * `trialReminderSentAt` sayesinde her işletmeye en fazla bir kez gönderilir.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET tanımlı değil." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  const now = Date.now();
  const windowEnd = new Date(now + 30 * 3_600_000); // ~1 gün + pay (cron zamanlama toleransı)

  const due = await prisma.business.findMany({
    where: {
      subscriptionStatus: "trialing",
      trialReminderSentAt: null,
      trialEndsAt: { gt: new Date(now), lte: windowEnd },
    },
    select: { id: true, name: true, trialEndsAt: true, owner: { select: { email: true } } },
    take: 200,
  });

  let sent = 0;
  const failed: string[] = [];

  for (const b of due) {
    const to = b.owner?.email;
    if (!to) continue;
    const { subject, html } = trialReminderEmail({ businessName: b.name, trialEndsAt: b.trialEndsAt });
    const res = await sendEmail({ to, subject, html });
    if (res.ok) {
      await prisma.business.update({
        where: { id: b.id },
        data: { trialReminderSentAt: new Date() },
      });
      sent++;
    } else {
      failed.push(`${b.id}: ${res.error ?? "bilinmeyen"}`);
    }
  }

  return NextResponse.json({ ok: true, candidates: due.length, sent, failed });
}
