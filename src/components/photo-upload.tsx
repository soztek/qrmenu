"use client";

import Image from "next/image";
import { useState, useRef } from "react";

/**
 * Görsel yükleme bileşeni. Seçilen dosyayı /api/upload'a gönderir.
 * - `name` verilirse dönen URL gizli input'a yazılır (form için).
 * - `onChange` verilirse yeni URL callback ile bildirilir (doğrudan-aksiyon için).
 */
export function PhotoUpload({
  name,
  initialUrl = null,
  label,
  aspect = "square",
  onChange,
}: {
  name?: string;
  initialUrl?: string | null;
  label?: string;
  aspect?: "square" | "wide";
  onChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const wide = aspect === "wide";

  function update(next: string) {
    setUrl(next);
    onChange?.(next);
  }

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
      if (!res.ok) setError(data.error ?? "Yükleme başarısız");
      else update(data.url);
    } catch {
      setError("Yükleme sırasında hata oluştu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      )}
      <div className="flex items-center gap-3">
        {name && <input type="hidden" name={name} value={url} />}

        {url ? (
          <Image
            src={url}
            alt={label ?? "Görsel"}
            width={wide ? 96 : 56}
            height={56}
            className={`${wide ? "w-24" : "w-14"} h-14 rounded-lg object-cover`}
          />
        ) : (
          <div
            className={`${wide ? "w-24" : "w-14"} grid h-14 place-items-center rounded-lg bg-surface-2 text-xl`}
          >
            🖼️
          </div>
        )}

        <div className="text-sm">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-muted transition hover:border-green/50 hover:text-fg">
            {uploading ? "Yükleniyor…" : url ? "Değiştir" : "Görsel ekle"}
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
              onClick={() => update("")}
              className="ml-2 text-faint hover:text-orange"
            >
              Kaldır
            </button>
          )}
          {error && <p className="mt-1 text-xs text-orange">{error}</p>}
        </div>
      </div>
    </div>
  );
}
