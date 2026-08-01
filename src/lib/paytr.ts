import crypto from "crypto";
import { getPlan, type PlanId } from "@/lib/plans";

/** PayTR yapılandırması (env). Eksikse null → ödeme kapalı. */
export function paytrConfig() {
  const id = process.env.PAYTR_MERCHANT_ID;
  const key = process.env.PAYTR_MERCHANT_KEY;
  const salt = process.env.PAYTR_MERCHANT_SALT;
  if (!id || !key || !salt) return null;
  return {
    id,
    key,
    salt,
    testMode: process.env.PAYTR_TEST_MODE === "1" ? "1" : "0",
  };
}

export type BillingPeriod = "monthly" | "yearly";

export const PERIODS: Record<BillingPeriod, { label: string; days: number }> = {
  monthly: { label: "Aylık", days: 30 },
  yearly: { label: "Yıllık", days: 365 },
};

/** Paket + döneme göre TL fiyat. Yıllık = 10 aylık (2 ay hediye). */
export function priceForTL(plan: PlanId, period: BillingPeriod): number {
  const m = getPlan(plan).priceMonthly;
  return period === "yearly" ? m * 10 : m;
}

/** Kuruş cinsinden tutar (PayTR tam sayı ister). */
export function amountKurus(plan: PlanId, period: BillingPeriod): number {
  return priceForTL(plan, period) * 100;
}

function hmacB64(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("base64");
}

/** PayTR bildiriminin (callback) hash doğrulaması. */
export function verifyCallback(
  merchantOid: string,
  status: string,
  totalAmount: string,
  hash: string,
): boolean {
  const cfg = paytrConfig();
  if (!cfg) return false;
  const expected = hmacB64(
    merchantOid + cfg.salt + status + totalAmount,
    cfg.key,
  );
  return expected === hash;
}

/** PayTR iFrame ödeme token'ı üretir. Başarısızsa { error } döner. */
export async function createPaytrToken(opts: {
  merchantOid: string;
  amountKurus: number;
  email: string;
  userIp: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  basketName: string;
  okUrl: string;
  failUrl: string;
}): Promise<{ token?: string; error?: string }> {
  const cfg = paytrConfig();
  if (!cfg) return { error: "Ödeme altyapısı yapılandırılmamış." };

  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";
  const userBasket = Buffer.from(
    JSON.stringify([
      [opts.basketName, (opts.amountKurus / 100).toFixed(2), 1],
    ]),
  ).toString("base64");

  const hashStr =
    cfg.id +
    opts.userIp +
    opts.merchantOid +
    opts.email +
    String(opts.amountKurus) +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    cfg.testMode;
  const paytrToken = hmacB64(hashStr + cfg.salt, cfg.key);

  const params = new URLSearchParams({
    merchant_id: cfg.id,
    user_ip: opts.userIp,
    merchant_oid: opts.merchantOid,
    email: opts.email,
    payment_amount: String(opts.amountKurus),
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: "1",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: opts.userName,
    user_address: opts.userAddress,
    user_phone: opts.userPhone,
    merchant_ok_url: opts.okUrl,
    merchant_fail_url: opts.failUrl,
    timeout_limit: "30",
    currency,
    test_mode: cfg.testMode,
    lang: "tr",
  });

  try {
    const res = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await res.json()) as { status: string; token?: string; reason?: string };
    if (data.status === "success" && data.token) return { token: data.token };
    return { error: data.reason || "Ödeme token'ı alınamadı." };
  } catch {
    return { error: "PayTR'ye bağlanılamadı, tekrar deneyin." };
  }
}
