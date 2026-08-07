import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { expandVideoPrompt, VeoError } from "@/lib/veo";

export const runtime = "nodejs";

/** Kısa konudan tam Veo reklam prompt'u üretir (Claude). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  let body: { topic?: string; businessName?: string; productName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim().slice(0, 500);
  if (topic.length < 3) {
    return NextResponse.json({ error: "Lütfen kısa bir konu yazın." }, { status: 400 });
  }

  try {
    const prompt = await expandVideoPrompt(topic, {
      businessName: body.businessName,
      productName: body.productName,
    });
    return NextResponse.json({ prompt });
  } catch (err) {
    const message = err instanceof VeoError ? err.message : "Prompt oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
