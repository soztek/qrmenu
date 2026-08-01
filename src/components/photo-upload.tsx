"use client";

import Image from "next/image";
import { useState, useRef } from "react";

interface Candidate {
  thumb: string;
  full: string;
  source: string;
}

/**
 * Seçilen görseli verilen orana (ör. 3 = 3:1) ortadan kırpıp yeniden boyutlar.
 * Çıktı: JPEG blob (varsayılan 1200px genişlik). Banner standardı için kullanılır.
 */
async function cropImageToAspect(
  file: File,
  aspect: number,
  outW = 1200,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new window.Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const outH = Math.round(outW / aspect);
    const srcAspect = img.width / img.height;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (srcAspect > aspect) {
      // fazla geniş → yanlardan kırp
      sw = img.height * aspect;
      sx = (img.width - sw) / 2;
    } else {
      // fazla uzun → üst/alttan kırp
      sh = img.width / aspect;
      sy = (img.height - sh) / 2;
    }
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.9),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Görsel yükleme bileşeni. Seçilen dosyayı /api/upload'a gönderir.
 * - `name` verilirse dönen URL gizli input'a yazılır (form için).
 * - `onChange` verilirse yeni URL callback ile bildirilir.
 * - `getQuery` verilirse "Örnek görsel bul" (internetten ücretsiz görsel) çıkar.
 */
export function PhotoUpload({
  name,
  initialUrl = null,
  label,
  aspect = "square",
  cropTo,
  hint,
  onChange,
  getQuery,
}: {
  name?: string;
  initialUrl?: string | null;
  label?: string;
  aspect?: "square" | "wide";
  /** Verilirse yüklemeden önce görsel bu orana kırpılır (ör. 3 = 3:1 banner). */
  cropTo?: number;
  hint?: string;
  onChange?: (url: string) => void;
  getQuery?: () => string;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const wide = aspect === "wide";
  const bannerMode = typeof cropTo === "number";

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
      if (cropTo) {
        const cropped = await cropImageToAspect(file, cropTo);
        fd.append("file", cropped, "banner.jpg");
      } else {
        fd.append("file", file);
      }
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

  async function findImages() {
    const q = getQuery?.().trim() ?? "";
    if (!q) {
      setError("Önce ürün adını yaz, sonra örnek görsel ara.");
      return;
    }
    setSearching(true);
    setError("");
    setCandidates([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCandidates(data.results ?? []);
    } catch {
      setError("Görsel araması başarısız oldu.");
    } finally {
      setSearching(false);
    }
  }

  async function pick(c: Candidate) {
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/image-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: c.full }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Görsel eklenemedi");
      else {
        update(data.url);
        setCandidates([]);
        setSearched(false);
      }
    } catch {
      setError("Görsel eklenirken hata oluştu.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      )}
      {name && <input type="hidden" name={name} value={url} />}

      {/* Banner (3:1) modu: tam genişlik önizleme */}
      {bannerMode && (
        <div className="mb-2 aspect-[3/1] w-full overflow-hidden rounded-lg border border-border bg-surface-2">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label ?? "Banner"} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-faint">
              🖼️ 3:1 banner (1200×400)
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!bannerMode &&
          (url ? (
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
          ))}

        <div className="flex flex-wrap items-center gap-2 text-sm">
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

          {getQuery && (
            <button
              type="button"
              onClick={findImages}
              disabled={searching || importing}
              className="rounded-lg border border-border px-3 py-1.5 text-muted transition hover:border-green/50 hover:text-fg disabled:opacity-60"
            >
              {searching ? "Aranıyor…" : "✨ Örnek görsel bul"}
            </button>
          )}

          {url && (
            <button
              type="button"
              onClick={() => update("")}
              className="text-faint hover:text-orange"
            >
              Kaldır
            </button>
          )}
        </div>
      </div>

      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-orange">{error}</p>}

      {/* Aday görseller */}
      {searched && (
        <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
          {importing ? (
            <p className="text-sm text-muted">Görsel ekleniyor…</p>
          ) : candidates.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-faint">Beğendiğine dokun:</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(c)}
                    className="aspect-square overflow-hidden rounded-lg border border-border transition hover:border-green"
                    title="Bu görseli kullan"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.thumb}
                      alt="Aday görsel"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-faint">
              {searching ? "Aranıyor…" : "Sonuç bulunamadı. Farklı bir ad dene."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
