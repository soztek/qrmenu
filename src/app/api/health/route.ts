import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hafif sağlık ucu — sipariş migration'ının canlıda olup olmadığını yoklar. */
export async function GET() {
  let ordersMigration = false;
  try {
    await prisma.orderSettings.count();
    ordersMigration = true;
  } catch {
    ordersMigration = false;
  }
  return NextResponse.json({ ok: true, ordersMigration, version: "reports-v1", ts: Date.now() });
}
