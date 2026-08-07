import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getVideoStatus, downloadVideoBytes } from "@/lib/veo";
import { saveVideo } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Veo operation durumu. operationId "models/.../operations/xyz" gibi eğik çizgi
 * içerdiği için catch-all segment kullanılır.
 * Tamamlandığında MP4 indirilip Blob'a kaydedilir ve videoUrl döner.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ operationId: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { operationId } = await params;
  const opName = (operationId ?? []).join("/");
  if (!opName) {
    return NextResponse.json({ error: "Operation kimliği yok." }, { status: 400 });
  }

  const result = await getVideoStatus(opName);

  if (result.status === "running") {
    return NextResponse.json({ status: "generating" });
  }
  if (result.status === "error") {
    return NextResponse.json({
      status: "error",
      error: result.message,
      detail: result.detail,
    });
  }

  // done → indir + Blob'a kaydet
  try {
    const bytes = await downloadVideoBytes(result.uri);
    const videoUrl = await saveVideo(bytes, "mp4");
    return NextResponse.json({ status: "done", videoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video kaydedilemedi.";
    console.error("Video kaydetme hatası:", err);
    return NextResponse.json({ status: "error", error: message });
  }
}
