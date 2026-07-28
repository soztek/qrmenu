import "server-only";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { put, del } from "@vercel/blob";

/**
 * Dosya depolama soyutlaması.
 * - Vercel Blob token'ı varsa (production): Vercel Blob'a yükler, tam https URL döner.
 * - Yoksa (yerel geliştirme): public/uploads'a yazar, /uploads/... yolu döner.
 *
 * Vercel'de public/uploads KALICI DEĞİL; bu yüzden prod'da mutlaka Blob kullanılır.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUpload(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Dosya 5MB'tan büyük olamaz.");
  }

  const key = `uploads/${randomBytes(12).toString("hex")}.${ext}`;

  if (useBlob()) {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return blob.url; // tam https URL
  }

  // Vercel'de dosya sistemi salt-okunur; Blob token'ı yoksa net hata ver.
  if (process.env.VERCEL) {
    throw new Error(
      "Fotoğraf depolama yapılandırılmamış (BLOB_READ_WRITE_TOKEN yok). Lütfen yönetici ile iletişime geçin.",
    );
  }

  // Yerel disk (yalnızca geliştirme)
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", key), buffer);
  return `/${key}`; // /uploads/...
}

/** Yüklenen dosyayı siler (Blob tam URL veya yerel /uploads yolu). */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("http")) {
      await del(url);
    } else if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    // dosya yoksa / silinemezse sessizce geç
  }
}
