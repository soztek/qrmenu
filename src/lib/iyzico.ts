/* eslint-disable @typescript-eslint/no-explicit-any */
import Iyzipay from "iyzipay";

/** iyzico yapılandırması (env). Eksikse null → iyzico kapalı. */
export function iyzicoConfig() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) return null;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
  return { apiKey, secretKey, uri };
}

function client(): any | null {
  const cfg = iyzicoConfig();
  if (!cfg) return null;
  try {
    return new Iyzipay({
      apiKey: cfg.apiKey,
      secretKey: cfg.secretKey,
      uri: cfg.uri,
    });
  } catch (err) {
    console.error("iyzico client init hatası:", err);
    return null;
  }
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
  const iyzipay = client();
  if (!iyzipay) return { error: "iyzico yapılandırılmamış." };

  const price = opts.priceTL.toFixed(2);
  const contact = `${opts.buyer.name} ${opts.buyer.surname}`.trim();
  const addr = {
    contactName: contact || opts.buyer.name,
    city: opts.buyer.city || "İstanbul",
    country: "Turkey",
    address: opts.buyer.address || "Adres belirtilmedi",
  };

  const request = {
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

  return new Promise((resolve) => {
    try {
      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          console.error("iyzico checkout callback hatası:", err);
          return resolve({ error: "iyzico bağlantı hatası." });
        }
        if (result?.status === "success" && result.paymentPageUrl) {
          return resolve({
            token: result.token,
            paymentPageUrl: result.paymentPageUrl,
          });
        }
        console.error("iyzico checkout başarısız:", result?.errorCode, result?.errorMessage);
        resolve({ error: result?.errorMessage || "iyzico ödeme başlatılamadı." });
      });
    } catch (err) {
      console.error("iyzico checkout senkron hata:", err);
      resolve({ error: "iyzico ödeme başlatılamadı (sunucu)." });
    }
  });
}

export async function retrieveIyzicoResult(
  token: string,
): Promise<{ paid: boolean; conversationId?: string }> {
  const iyzipay = client();
  if (!iyzipay) return { paid: false };
  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve(
      { locale: "tr", token },
      (err: any, result: any) => {
        if (err || !result) return resolve({ paid: false });
        resolve({
          paid:
            result.status === "success" && result.paymentStatus === "SUCCESS",
          conversationId: result.conversationId || result.basketId,
        });
      },
    );
  });
}
