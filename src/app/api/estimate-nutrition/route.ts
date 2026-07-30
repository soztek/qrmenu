import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Yemek adından tahmini besin değeri (yapay zeka).
 * Yerleşik tabloda (src/lib/nutrition.ts) bulunamayan ürünler için yedek.
 * Claude Haiku 4.5 ile hızlı/uygun maliyetli tahmin; değerler yaklaşıktır.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Yapay zeka tahmini şu an kapalı (yönetici anahtarı eklemeli)." },
      { status: 503 },
    );
  }

  let name = "";
  try {
    const body = await req.json();
    name = String(body?.name ?? "").trim().slice(0, 100);
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Ürün adı çok kısa" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "Sen bir Türk mutfağı beslenme uzmanısın. Verilen yemek/içecek adı için " +
        "tipik bir restoran porsiyonunun (1 porsiyon) yaklaşık besin değerlerini tahmin et. " +
        "SADECE şu biçimde tek satır geçerli JSON döndür, başka hiçbir metin yazma: " +
        '{"calories": <kcal tamsayı>, "protein": <g>, "fat": <g>, "carbs": <g>}',
      messages: [
        {
          role: "user",
          content: `Yemek: "${name}". 1 porsiyon için besin değeri JSON.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw =
      textBlock && textBlock.type === "text" ? textBlock.text : "";
    // Olası kod bloğu/çerçeveleri temizle, ilk JSON nesnesini yakala.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "Yapay zeka tahmini şu an yapılamadı, tekrar deneyin." },
        { status: 502 },
      );
    }
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const num = (v: unknown, max: number) => {
      const n = Math.round(Number(v) * 10) / 10;
      return Number.isFinite(n) && n >= 0 && n <= max ? n : 0;
    };
    const nutrition = {
      calories: Math.round(num(parsed.calories, 5000)),
      protein: num(parsed.protein, 500),
      fat: num(parsed.fat, 500),
      carbs: num(parsed.carbs, 500),
    };

    return NextResponse.json({ nutrition });
  } catch (err) {
    const detail =
      err instanceof Anthropic.APIError
        ? `${err.status ?? ""} ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("AI estimate error:", detail);
    return NextResponse.json(
      { error: "Yapay zeka tahmini şu an yapılamadı, tekrar deneyin." },
      { status: 502 },
    );
  }
}
