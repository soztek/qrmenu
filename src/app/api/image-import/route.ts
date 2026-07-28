import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Seçilen dış görsel URL'ini sunucuda indirip Blob'a yükler. POST {url}. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let url: string;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "Geçersiz görsel adresi" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SoztekQRMenu/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Görsel indirilemedi" }, { status: 400 });
    }
    let type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Görsel çok büyük" }, { status: 400 });
    }
    // İçerik tipini doğrula / tahmin et.
    if (!ALLOWED.includes(type)) {
      type = sniffType(buf) ?? "";
      if (!ALLOWED.includes(type)) {
        return NextResponse.json(
          { error: "Desteklenmeyen görsel türü" },
          { status: 400 },
        );
      }
    }
    const file = new File([buf], "image", { type });
    const savedUrl = await saveUpload(file);
    return NextResponse.json({ url: savedUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "İçe aktarma hatası" },
      { status: 400 },
    );
  }
}

/** Baytların sihirli imzasından görsel türünü tahmin eder. */
function sniffType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}
