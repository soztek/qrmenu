import { NextResponse } from "next/server";
import { createOrder, OrderError, type CreateOrderInput } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Müşteri siparişi oluşturur (üyeliksiz). Güvenlik & fiyat backend'de. */
export async function POST(req: Request) {
  let body: Partial<CreateOrderInput> & { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const tableToken = String(body.tableToken ?? "").trim();
  const idempotencyKey = String(body.idempotencyKey ?? "").trim();
  if (!tableToken || idempotencyKey.length < 8) {
    return NextResponse.json({ ok: false, error: "Eksik bilgi." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length || rawItems.length > 50) {
    return NextResponse.json({ ok: false, error: "Sepet geçersiz." }, { status: 400 });
  }

  const items = rawItems.slice(0, 50).map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      menuItemId: String(o.menuItemId ?? ""),
      quantity: Number(o.quantity ?? 1),
      note: o.note ? String(o.note) : undefined,
      optionIds: Array.isArray(o.optionIds)
        ? (o.optionIds as unknown[]).map((x) => String(x)).slice(0, 30)
        : [],
    };
  });
  if (items.some((i) => !i.menuItemId)) {
    return NextResponse.json({ ok: false, error: "Sepet geçersiz." }, { status: 400 });
  }

  try {
    const order = await createOrder({
      tableToken,
      idempotencyKey,
      customerName: body.customerName ? String(body.customerName) : undefined,
      note: body.note ? String(body.note) : undefined,
      items,
    });
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ ok: false, error: err.message, code: err.code }, { status: 400 });
    }
    console.error("Sipariş oluşturma hatası:", err);
    return NextResponse.json(
      { ok: false, error: "Sipariş oluşturulamadı, tekrar deneyin." },
      { status: 500 },
    );
  }
}
