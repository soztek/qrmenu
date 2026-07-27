"use client";

import Image from "next/image";
import { useState, useRef } from "react";

/**
 * Ürün fotoğrafı yükleme. Seçilen dosyayı /api/upload'a gönderir, dönen URL'i
 * gizli input'a yazar (forma dahil olur). Önizleme gösterir.
 */
export function PhotoUpload({
  name = "photoUrl",
  initialUrl = null,
}: {
  name?: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Yükleme başarısız");
      } else {
        setUrl(data.url);
      }
    } catch {
      setError("Yükleme sırasında hata oluştu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={url} />

      {url ? (
        <Image
          src={url}
          alt="Ürün fotoğrafı"
          width={56}
          height={56}
          className="h-14 w-14 rounded-lg object-cover"
        />
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-lg bg-surface-2 text-xl">
          🍽️
        </div>
      )}

      <div className="text-sm">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-muted transition hover:border-green/50 hover:text-fg">
          {uploading ? "Yükleniyor…" : url ? "Değiştir" : "Fotoğraf ekle"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="ml-2 text-faint hover:text-orange"
          >
            Kaldır
          </button>
        )}
        {error && <p className="mt-1 text-xs text-orange">{error}</p>}
      </div>
    </div>
  );
}
