"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderDTO } from "@/lib/orders/service";
import type { OrderStatus } from "@/lib/orders/types";
import { setOrderStatus } from "@/lib/actions/orders";

function elapsedMin(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

/** Bekleme süresine göre görsel uyarı — renk + yazı/ikon (renk tek başına değil). */
function timeState(mins: number, warn: number) {
  if (mins >= warn * 2)
    return { border: "border-red-500", chip: "bg-red-500/15 text-red-400", label: "🔴 Çok gecikti" };
  if (mins >= warn)
    return { border: "border-orange", chip: "bg-orange-soft text-orange", label: "🟠 Gecikiyor" };
  return { border: "border-border", chip: "bg-surface-2 text-muted", label: "🟢 Zamanında" };
}

const COLUMNS: { key: string; title: string; statuses: OrderStatus[] }[] = [
  { key: "todo", title: "Bekleyen", statuses: ["accepted"] },
  { key: "prep", title: "Hazırlanıyor", statuses: ["preparing"] },
  { key: "ready", title: "Hazır", statuses: ["ready"] },
];

export function KitchenScreen({
  initialOrders,
  prepWarnMins,
}: {
  initialOrders: OrderDTO[];
  prepWarnMins: number;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [busy, setBusy] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [connected, setConnected] = useState(true);
  const [, force] = useState(0);

  const knownRef = useRef<Set<string>>(
    new Set(initialOrders.filter((o) => o.status === "accepted").map((o) => o.id)),
  );
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);
  soundRef.current = soundOn;

  // Süre etiketleri canlı kalsın diye dakikada bir yeniden çiz
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  function beep() {
    const ctx = audioRef.current;
    if (!ctx) return;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 760;
      g.gain.value = 0.12;
      const t = ctx.currentTime + i * 0.3;
      o.start(t);
      o.stop(t + 0.22);
    }
  }
  function enableSound() {
    try {
      if (!audioRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new AC();
      }
      audioRef.current?.resume();
      setSoundOn(true);
      beep();
    } catch {
      setSoundOn(false);
    }
  }

  const fetchNow = useCallback(async () => {
    try {
      const res = await fetch("/api/business/orders", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) return;
      setConnected(true);
      const next: OrderDTO[] = data.orders;
      const fresh = next.some((o) => o.status === "accepted" && !knownRef.current.has(o.id));
      next.forEach((o) => {
        if (o.status === "accepted") knownRef.current.add(o.id);
      });
      if (fresh && soundRef.current) beep();
      setOrders(next);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchNow, 5000);
    const onFocus = () => {
      if (!document.hidden) fetchNow();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNow]);

  async function move(id: string, to: OrderStatus) {
    setBusy(id);
    try {
      const r = await setOrderStatus(id, to);
      if (!r.ok) {
        alert(r.error || "İşlem başarısız.");
      } else {
        setOrders((prev) => prev.map((o) => (o.id === id ? r.data : o)));
      }
    } finally {
      setBusy("");
    }
    fetchNow();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">🍳 Mutfak Ekranı</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1.5 ${connected ? "text-green" : "text-orange"}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green" : "bg-orange"}`} />
            {connected ? "Canlı" : "Bağlanıyor…"}
          </span>
          <button
            onClick={soundOn ? () => setSoundOn(false) : enableSound}
            className={`rounded-lg border px-3 py-1.5 transition ${
              soundOn ? "border-green/50 text-green" : "border-border text-muted hover:text-fg"
            }`}
          >
            {soundOn ? "🔔 Ses açık" : "🔕 Sesi aç"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <div key={col.key} className="rounded-2xl border border-border bg-surface/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-bold uppercase tracking-wide text-fg">{col.title}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-faint">
                    —
                  </div>
                )}
                {items.map((o) => {
                  const mins = elapsedMin(o.createdAt);
                  const ts = timeState(mins, prepWarnMins);
                  return (
                    <div key={o.id} className={`rounded-xl border-2 bg-surface p-3 ${ts.border}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-lg font-bold text-fg">{o.code}</span>
                          <span className="ml-1.5 text-sm font-semibold text-fg">{o.tableLabel}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ts.chip}`}>
                          {mins} dk · {ts.label}
                        </span>
                      </div>

                      <ul className="mt-2 space-y-1">
                        {o.items.map((it) => (
                          <li key={it.id} className="text-base leading-tight">
                            <span className="font-bold text-fg">
                              {it.quantity}× {it.name}
                            </span>
                            {it.modifiers.length > 0 && (
                              <span className="ml-1 text-sm text-muted">
                                ({it.modifiers.map((m) => m.name).join(", ")})
                              </span>
                            )}
                            {it.note && (
                              <span className="mt-0.5 block text-sm font-medium text-orange">↳ {it.note}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {o.note && <p className="mt-1 text-sm text-orange">Not: {o.note}</p>}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {o.status === "accepted" && (
                          <KBtn busy={busy === o.id} onClick={() => move(o.id, "preparing")} primary>
                            ▶ Hazırlamaya başla
                          </KBtn>
                        )}
                        {o.status === "preparing" && (
                          <KBtn busy={busy === o.id} onClick={() => move(o.id, "ready")} primary>
                            ✓ Hazır
                          </KBtn>
                        )}
                        {o.status === "ready" && (
                          <KBtn busy={busy === o.id} onClick={() => move(o.id, "served")}>
                            🍽 Teslim edildi
                          </KBtn>
                        )}
                        <a
                          href={`/mutfak-fis/${o.id}`}
                          target="_blank"
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:text-fg"
                        >
                          🧾 Fiş
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KBtn({
  children,
  onClick,
  busy,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
        primary ? "bg-green text-black hover:bg-green-dark" : "border border-border text-fg hover:border-green/50"
      }`}
    >
      {busy ? "…" : children}
    </button>
  );
}
