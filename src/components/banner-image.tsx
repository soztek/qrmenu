"use client";

import { useState } from "react";

/**
 * İşletme üst banner'ı — sabit 3:1 oran, object-cover.
 * Mobilde ekran yüksekliğinin en fazla ~%25'i. Görsel yüklenene kadar arkada
 * skeleton (nabız) gösterir; UI kaymaz. Resim opaklıkla gizlenmez (önbellekten
 * gelen görsellerde onLoad tetiklenmese bile resim görünür kalır).
 */
export function BannerImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative w-full overflow-hidden bg-surface-2"
      style={{ aspectRatio: "3 / 1", maxHeight: "25vh" }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-surface-2" aria-hidden />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className="relative h-full w-full object-cover"
      />
    </div>
  );
}
