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
  // Sadece giriş yapmış işletme sahipleri kullanabilsin (kötüye kullanımı önle).
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
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system:
        "Sen bir Türk mutfağı beslenme uzmanısın. Verilen yemek/içecek adı için " +
        "TİPİK BİR RESTORAN PORSİYONUNUN (1 porsiyon) yaklaşık besin değerlerini " +
        "tahmin et. Sadece istenen JSON'u döndür; başka metin yazma. Değerler " +
        "gram ve kcal cinsinden makul tam/ondalık sayılar olsun.",
      messages: [
        {
          role: "user",
          content: `Yemek: "${name}"\n1 porsiyon için kalori (kcal), protein (g), yağ (g), karbonhidrat (g) tahmini.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              calories: { type: "integer" },
              protein: { type: "number" },
              fat: { type: "number" },
              carbs: { type: "number" },
            },
            required: ["calories", "protein", "fat", "carbs"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Tahmin alınamadı" }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as Record<string, unknown>;
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
  } catch {
    return NextResponse.json(
      { error: "Yapay zeka tahmini şu an yapılamadı, tekrar deneyin." },
      { status: 502 },
    );
  }
}
