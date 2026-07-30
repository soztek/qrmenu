"use client";

import { useEffect } from "react";

/**
 * Herkese açık sayfalarda ziyaret sayacını tetikler.
 * Aynı sekmede aynı gün tekrar tekrar saymamak için oturum başına bir kez gönderir.
 * Menü sayfalarında `slug` verilirse işletme bazlı da sayılır.
 */
export function VisitTracker({
  kind,
  slug,
}: {
  kind: "landing" | "menu";
  slug?: string;
}) {
  useEffect(() => {
    try {
      const key = `vt:${kind}:${slug ?? ""}:${new Date().toDateString()}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const body = JSON.stringify(slug ? { kind, slug } : { kind });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", body);
      } else {
        fetch("/api/track", { method: "POST", body, keepalive: true });
      }
    } catch {
      // sessizce yut
    }
  }, [kind, slug]);
  return null;
}
