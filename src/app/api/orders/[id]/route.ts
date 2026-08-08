import { NextResponse } from "next/server";
import { getCustomerOrder } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Müşteri sipariş takibi — tahmin edilemez sipariş id'si ile (üyeliksiz). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Geçersiz." }, { status: 400 });
  }
  const order = await getCustomerOrder(id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order });
}
