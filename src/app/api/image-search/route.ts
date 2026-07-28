import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchStockImages } from "@/lib/image-search";

/** Ürün adına göre ücretsiz görsel arar. GET ?q=... */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  const results = await searchStockImages(q);
  return NextResponse.json({ results });
}
