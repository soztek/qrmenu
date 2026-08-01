import { verifyCallback } from "@/lib/paytr";
import { grantSubscription, markFailed } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * PayTR bildirim (callback) ucu. Hash doğrulanır; başarılıysa abonelik uzatılır.
 * PayTR'nin tekrar denememesi için düz metin "OK" dönmek ZORUNLU.
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

  if (status === "success") {
    await grantSubscription(merchantOid);
  } else {
    await markFailed(merchantOid);
  }

  return new Response("OK");
}
