import Link from "next/link";
import crypto from "crypto";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlan, formatPrice, type PlanId } from "@/lib/plans";
import {
  paytrConfig,
  createPaytrToken,
  amountKurus,
  priceForTL,
  PERIODS,
  type BillingPeriod,
} from "@/lib/paytr";
import { PaytrIframe } from "./paytr-iframe";

export const metadata: Metadata = { title: "Ödeme" };
export const dynamic = "force-dynamic";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.soztekqrmenu.com.tr";

function isPlan(v: string): v is PlanId {
  return v === "starter" || v === "pro" || v === "premium";
}
function isPeriod(v: string): v is BillingPeriod {
  return v === "monthly" || v === "yearly";
}

export default async function OdemePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.business) return null;
  const b = user.business;

  const sp = await searchParams;
  const plan = sp.plan && isPlan(sp.plan) ? sp.plan : "starter";
  const period: BillingPeriod =
    sp.period && isPeriod(sp.period) ? sp.period : "monthly";
  const planInfo = getPlan(plan);
  const priceTL = priceForTL(plan, period);

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Ödeme</h1>
        <Link
          href="/dashboard/abonelik"
          className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
        >
          ← Paketler
        </Link>
      </div>
      <p className="mt-1 text-muted">
        {planInfo.name} · {PERIODS[period].label} · {formatPrice(priceTL)}
      </p>
      <div className="mt-6">{children}</div>
    </div>
  );

  // Ödeme altyapısı henüz bağlanmadıysa
  if (!paytrConfig()) {
    return shell(
      <div className="rounded-2xl border border-orange/40 bg-orange/10 p-6 text-sm">
        <p className="font-semibold text-orange">
          Ödeme altyapısı henüz bağlanmadı.
        </p>
        <p className="mt-2 text-muted">
          PayTR bilgileri (merchant id/key/salt) sisteme eklendiğinde ödeme bu
          sayfada açılacak. Şu an deneme sürümündesiniz.
        </p>
      </div>,
    );
  }

  // İstek bilgileri
  const h = await headers();
  const userIp =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || "85.34.78.112";

  const merchantOid = crypto.randomUUID().replace(/-/g, "");
  const amount = amountKurus(plan, period);

  // Ödeme kaydı (pending)
  await prisma.payment.create({
    data: {
      merchantOid,
      businessId: b.id,
      plan,
      period,
      days: PERIODS[period].days,
      amount,
    },
  });

  const phone = (b.phone || b.whatsapp || "05000000000").replace(/[^\d+]/g, "");
  const { token, error } = await createPaytrToken({
    merchantOid,
    amountKurus: amount,
    email: user.email,
    userIp,
    userName: user.name || b.name,
    userPhone: phone || "05000000000",
    userAddress: b.address || "Adres belirtilmedi",
    basketName: `${planInfo.name} ${PERIODS[period].label} abonelik`,
    okUrl: `${APP_URL}/dashboard/abonelik/basarili`,
    failUrl: `${APP_URL}/dashboard/abonelik/basarisiz`,
  });

  if (!token) {
    return shell(
      <div className="rounded-2xl border border-orange/40 bg-orange/10 p-6 text-sm">
        <p className="font-semibold text-orange">Ödeme başlatılamadı</p>
        <p className="mt-2 text-muted">{error}</p>
        <Link
          href={`/dashboard/abonelik/odeme?plan=${plan}&period=${period}`}
          className="mt-4 inline-block rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black"
        >
          Tekrar dene
        </Link>
      </div>,
    );
  }

  return shell(
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <PaytrIframe token={token} />
    </div>,
  );
}
