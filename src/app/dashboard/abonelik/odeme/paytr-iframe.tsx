"use client";

import { useEffect } from "react";

/** PayTR güvenli ödeme iframe'i (otomatik yükseklik ayarı ile). */
export function PaytrIframe({ token }: { token: string }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://www.paytr.com/js/iframeResizer.min.js";
    s.async = true;
    s.onload = () => {
      const w = window as unknown as {
        iFrameResize?: (opts: object, target: string) => void;
      };
      w.iFrameResize?.({}, "#paytriframe");
    };
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return (
    <iframe
      src={`https://www.paytr.com/odeme/guvenli/${token}`}
      id="paytriframe"
      frameBorder={0}
      scrolling="no"
      style={{ width: "100%", minHeight: 640 }}
      title="PayTR Ödeme"
    />
  );
}
