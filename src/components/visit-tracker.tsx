"use client";

import { useEffect } from "react";

/**
 * Herkese açık sayfalarda ziyaret sayacını tetikler.
 * Aynı sekmede aynı gün tekrar tekrar saymamak için oturum başına bir kez gönderir.
 */
export function VisitTracker({ kind }: { kind: "landing" | "menu" }) {
  useEffect(() => {
    try {
      const key = `vt:${kind}:${new Date().toDateString()}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const body = JSON.stringify({ kind });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", body);
      } else {
        fetch("/api/track", { method: "POST", body, keepalive: true });
      }
    } catch {
      // sessuzca yut
    }
  }, [kind]);
  return null;
}
