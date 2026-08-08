import { NextResponse } from "next/server";
import { createServiceRequest, OrderError } from "@/lib/orders/service";
import type { ServiceRequestType } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: ServiceRequestType[] = ["waiter", "bill", "water", "cleaning", "other"];

/** Müşteri servis talebi (garson çağır / hesap iste ...). Üyeliksiz, rate-limitli. */
export async function POST(req: Request) {
  let body: { tableToken?: string; type?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }
  const token = String(body.tableToken ?? "").trim();
  const type = String(body.type ?? "") as ServiceRequestType;
  if (!token || !VALID.includes(type)) {
    return NextResponse.json({ ok: false, error: "Geçersiz talep." }, { status: 400 });
  }
  try {
    await createServiceRequest(token, type, body.note ? String(body.note) : undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.code === "ratelimit" ? 429 : 400;
      return NextResponse.json({ ok: false, error: err.message }, { status });
    }
    console.error("Servis talebi hatası:", err);
    return NextResponse.json(
      { ok: false, error: "Talep iletilemedi." },
      { status: 500 },
    );
  }
}
