import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { planHasFeature } from "@/lib/plans";
import { hasActiveAccess } from "@/lib/subscription";
import { listBusinessOrders, listServiceRequests } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** İşletme paneli canlı veri (polling) — açık siparişler + servis talepleri. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const b = user.business;
  if (!planHasFeature(b.plan, "orders") || !hasActiveAccess(b)) {
    return NextResponse.json({ ok: true, orders: [], serviceRequests: [] });
  }
  const [orders, serviceRequests] = await Promise.all([
    listBusinessOrders(b.id),
    listServiceRequests(b.id),
  ]);
  return NextResponse.json({ ok: true, orders, serviceRequests, ts: Date.now() });
}
