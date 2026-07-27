import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

/** Kimlik doğrulamalı ürün fotoğrafı yükleme. FormData `file` alanı. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.business) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  try {
    const url = await saveUpload(file);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yükleme başarısız" },
      { status: 400 },
    );
  }
}
