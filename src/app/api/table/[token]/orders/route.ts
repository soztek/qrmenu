import { NextResponse } from "next/server";
import { getSessionOrders } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Masa QR token'ının aktif oturum siparişleri (müşteri, üyeliksiz). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Geçersiz." }, { status: 400 });
  }
  const data = await getSessionOrders(token);
  return NextResponse.json({ ok: true, ...data });
}
