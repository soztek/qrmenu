"use client";

import { useState } from "react";

export function QrDownload({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}) {
  return (
    <a
      href={dataUrl}
      download={filename}
      className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
    >
      QR kodunu indir (PNG)
    </a>
  );
}

/** Deneme sürümü: QR görünür ama indir/kopyala/yazdır kilitli — tıklayınca uyarı. */
export function LockedQrActions() {
  const [show, setShow] = useState(false);
  const btn =
    "rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition hover:text-fg";
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => setShow(true)} className={btn}>
          🔒 QR indir
        </button>
        <button type="button" onClick={() => setShow(true)} className={btn}>
          🔒 Linki kopyala
        </button>
        <button type="button" onClick={() => setShow(true)} className={btn}>
          🔒 Standları yazdır
        </button>
      </div>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setShow(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">🔒</div>
            <h2 className="mt-3 text-lg font-bold text-fg">QR ücretli pakete özeldir</h2>
            <p className="mt-2 text-sm text-muted">
              QR&apos;ı burada önizleyebilirsiniz ancak deneme sürümünde indiremez,
              kopyalayamaz veya yazdıramazsınız. Lütfen üretici ile görüşerek paketinizi
              yükseltin.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <a
                href="/dashboard/abonelik"
                className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black"
              >
                Paketi yükselt
              </a>
              <button
                onClick={() => setShow(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-fg"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* pano erişimi yoksa yok say */
        }
      }}
      className="rounded-lg border border-border px-4 py-2.5 text-sm text-fg transition hover:border-green/50"
    >
      {copied ? "Kopyalandı ✓" : "Linki kopyala"}
    </button>
  );
}
