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
