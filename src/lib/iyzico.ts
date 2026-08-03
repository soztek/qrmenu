import "server-only";
import crypto from "node:crypto";

/**
 * iyzico Checkout Form — SDK yerine doğrudan REST API (fetch) ile.
 * iyzipay npm paketi dinamik require + fs.readdirSync kullandığı için Vercel
 * serverless'ta dosyaları yüklenemiyor ve çöküyordu. Bu yüzden IYZWSv2 (HMAC-SHA256)
 * imzasını elle üretip Graph benzeri REST çağrısı yapıyoruz. Node bağımlılığı yok.
 */

/** iyzico yapılandırması (env). Eksikse null → iyzico kapalı. */
export function iyzicoConfig() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) return null;
  const uri = (process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com").replace(
    /\/+$/,
    "",
  );
  return { apiKey, secretKey, uri };
}

/** iyzico fiyat biçimi: 2490 -> "2490.0", 249.5 -> "249.5". */
function fmtPrice(n: number): string {
  const s = parseFloat(String(n)).toString();
  return s.indexOf(".") === -1 ? s + ".0" : s;
}

/** IYZWSv2 (HMAC-SHA256) yetkilendirme başlıkları. */
function authHeaders(
  uriPath: string,
  bodyStr: string,
  apiKey: string,
  secretKey: string,
): Record<string, string> {
  const randomKey = Date.now().toString() + crypto.randomBytes(8).toString("hex");
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(randomKey + uriPath + bodyStr)
    .digest("hex");
  const authParams = [
    "apiKey:" + apiKey,
    "randomKey:" + randomKey,
    "signature:" + signature,
  ].join("&");
  return {
    "Content-Type": "application/json",
    "x-iyzi-rnd": randomKey,
    Authorization: "IYZWSv2 " + Buffer.from(authParams).toString("base64"),
  };
}

async function iyziPost(
  uriPath: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const cfg = iyzicoConfig();
  if (!cfg) return null;
  const bodyStr = JSON.stringify(body);
  const res = await fetch(cfg.uri + uriPath, {
    method: "POST",
    headers: authHeaders(uriPath, bodyStr, cfg.apiKey, cfg.secretKey),
    body: bodyStr,
  });
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

export async function createIyzicoCheckout(opts: {
  conversationId: string;
  priceTL: number;
  callbackUrl: string;
  basketName: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    ip: string;
    address: string;
    city: string;
  };
}): Promise<{ token?: string; paymentPageUrl?: string; error?: string }> {
  const cfg = iyzicoConfig();
  if (!cfg) return { error: "iyzico yapılandırılmamış." };

  const price = fmtPrice(opts.priceTL);
  const addr = {
    contactName: `${opts.buyer.name} ${opts.buyer.surname}`.trim() || opts.buyer.name,
    city: opts.buyer.city || "İstanbul",
    country: "Turkey",
    address: opts.buyer.address || "Adres belirtilmedi",
  };

  const request: Record<string, unknown> = {
    locale: "tr",
    conversationId: opts.conversationId,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: opts.conversationId,
    paymentGroup: "SUBSCRIPTION",
    callbackUrl: opts.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: opts.buyer.id,
      name: opts.buyer.name || "Musteri",
      surname: opts.buyer.surname || "Isletme",
      gsmNumber: opts.buyer.phone || "+905000000000",
      email: opts.buyer.email,
      identityNumber: "11111111111",
      registrationAddress: opts.buyer.address || "Adres belirtilmedi",
      ip: opts.buyer.ip,
      city: opts.buyer.city || "İstanbul",
      country: "Turkey",
    },
    shippingAddress: addr,
    billingAddress: addr,
    basketItems: [
      {
        id: "plan",
        name: opts.basketName,
        category1: "Abonelik",
        itemType: "VIRTUAL",
        price,
      },
    ],
  };

  try {
    const result = await iyziPost(
      "/payment/iyzipos/checkoutform/initialize/auth/ecom",
      request,
    );
    if (!result) return { error: "iyzico bağlantı hatası." };
    if (result.status === "success" && result.paymentPageUrl) {
      return {
        token: String(result.token ?? ""),
        paymentPageUrl: String(result.paymentPageUrl),
      };
    }
    console.error(
      "iyzico checkout başarısız:",
      result.errorCode,
      result.errorMessage,
    );
    return { error: String(result.errorMessage || "iyzico ödeme başlatılamadı.") };
  } catch (err) {
    console.error("iyzico checkout hata:", err);
    return { error: "iyzico ödeme başlatılamadı (sunucu)." };
  }
}

export async function retrieveIyzicoResult(
  token: string,
): Promise<{ paid: boolean; conversationId?: string }> {
  try {
    const result = await iyziPost("/payment/iyzipos/checkoutform/auth/ecom/detail", {
      locale: "tr",
      token,
    });
    if (!result) return { paid: false };
    return {
      paid: result.status === "success" && result.paymentStatus === "SUCCESS",
      conversationId: String(result.conversationId || result.basketId || ""),
    };
  } catch (err) {
    console.error("iyzico retrieve hata:", err);
    return { paid: false };
  }
}
