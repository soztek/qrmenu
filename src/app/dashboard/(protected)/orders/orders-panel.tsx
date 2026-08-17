"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  SERVICE_REQUEST_META,
  type OrderStatus,
} from "@/lib/orders/types";
import type { OrderDTO, ServiceRequestDTO } from "@/lib/orders/service";
import {
  setOrderStatus,
  setPaymentStatus,
  handleServiceRequest,
  closeTable,
} from "@/lib/actions/orders";

const TONE: Record<string, string> = {
  muted: "bg-surface-2 text-muted",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  red: "bg-orange-soft text-orange",
};

const fmt = (n: number) =>
  "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

function elapsedMin(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const FILTERS: { key: string; label: string; match: (o: OrderDTO) => boolean }[] = [
  { key: "new", label: "Yeni", match: (o) => o.status === "pending" && o.paymentStatus !== "paid" },
  { key: "prep", label: "Hazırlanan", match: (o) => (o.status === "accepted" || o.status === "preparing") && o.paymentStatus !== "paid" },
  { key: "ready", label: "Hazır", match: (o) => o.status === "ready" && o.paymentStatus !== "paid" },
  { key: "served", label: "Teslim · ödeme bekleyen", match: (o) => o.status === "served" && o.paymentStatus !== "paid" },
  { key: "closed", label: "Kapatılan (ödendi)", match: (o) => o.paymentStatus === "paid" },
  { key: "cancel", label: "İptal/Ret", match: (o) => o.status === "cancelled" || o.status === "rejected" },
  { key: "all", label: "Tümü", match: () => true },
];

const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

export function OrdersPanel({
  initialOrders,
  initialRequests,
  soundDefault,
  prepWarnMins,
}: {
  initialOrders: OrderDTO[];
  initialRequests: ServiceRequestDTO[];
  soundDefault: boolean;
  prepWarnMins: number;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("new");
  const [soundOn, setSoundOn] = useState(false);
  const [busy, setBusy] = useState("");
  const [connected, setConnected] = useState(true);

  const knownRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const audioRef = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(false);
  soundOnRef.current = soundOn;

  function beep() {
    const ctx = audioRef.current;
    if (!ctx) return;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.12;
      const t = ctx.currentTime + i * 0.28;
      o.start(t);
      o.stop(t + 0.2);
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
      const newOrders: OrderDTO[] = data.orders;
      // yeni PENDING sipariş var mı?
      const fresh = newOrders.some(
        (o) => o.status === "pending" && !knownRef.current.has(o.id),
      );
      newOrders.forEach((o) => knownRef.current.add(o.id));
      if (fresh && soundOnRef.current) beep();
      setOrders(newOrders);
      setRequests(data.serviceRequests);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(fetchNow, 5000);
    // Sekmeye/pencereye dönünce anında yenile (arka plan sekme kısıtlamasını aşar)
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

  async function act(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>,
  ) {
    setBusy(key);
    try {
      const r = await fn();
      if (!r.ok) {
        alert(r.error || "İşlem başarısız.");
        return;
      }
      // Sipariş döndüyse anında güncelle (optimistic → tek tıkta yansır)
      const dto = r.data as OrderDTO | undefined;
      if (dto && typeof dto === "object" && "id" in dto) {
        setOrders((prev) => prev.map((o) => (o.id === dto.id ? dto : o)));
      }
    } finally {
      setBusy("");
    }
    fetchNow(); // arka planda tam senkron
  }

  function changeStatus(id: string, to: OrderStatus) {
    let reason: string | undefined;
    if (to === "rejected" || to === "cancelled") {
      const r = prompt(to === "rejected" ? "Reddetme nedeni:" : "İptal nedeni:");
      if (r == null || !r.trim()) return;
      reason = r.trim();
    }
    act("st" + id, () => setOrderStatus(id, to, reason));
  }

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const shown = orders.filter((o) => activeFilter.match(o));
  const counts = {
    new: orders.filter((o) => o.status === "pending").length,
    prep: orders.filter((o) => o.status === "accepted" || o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  // Günlük özet (bugünkü, iptal/ret hariç)
  const todays = orders.filter(
    (o) => isToday(o.createdAt) && o.status !== "cancelled" && o.status !== "rejected",
  );
  const dailyTotal = todays.reduce((s, o) => s + o.total, 0);
  const collected = todays
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Siparişler</h1>
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

      {/* Servis talepleri */}
      {requests.length > 0 && (
        <div className="mt-4 rounded-2xl border border-orange/40 bg-orange/10 p-3">
          <div className="mb-2 text-sm font-semibold text-orange">
            🔔 Servis talepleri ({requests.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {requests.map((r) => {
              const meta = SERVICE_REQUEST_META[r.type];
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
                >
                  <span>{meta.emoji}</span>
                  <span className="font-medium text-fg">{r.tableLabel}</span>
                  <span className="text-muted">{meta.label}</span>
                  <button
                    disabled={!!busy}
                    onClick={() => act("sr" + r.id, () => handleServiceRequest(r.id, "completed"))}
                    className="rounded bg-green px-2 py-0.5 text-xs font-semibold text-black"
                  >
                    Tamam
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const c = (counts as Record<string, number>)[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
                filter === f.key ? "bg-fg text-bg" : "border border-border text-muted hover:text-fg"
              }`}
            >
              {f.label}
              {c ? <span className="ml-1.5 rounded-full bg-orange px-1.5 text-xs text-black">{c}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Sipariş listesi */}
      {shown.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Bu bölümde sipariş yok.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {shown.map((o) => {
            const sm = ORDER_STATUS_META[o.status];
            const pm = PAYMENT_STATUS_META[o.paymentStatus as keyof typeof PAYMENT_STATUS_META];
            const mins = elapsedMin(o.createdAt);
            const late = (o.status === "pending" || o.status === "accepted" || o.status === "preparing") && mins >= prepWarnMins;
            return (
              <div
                key={o.id}
                className={`rounded-2xl border bg-surface p-4 ${
                  o.status === "pending" ? "border-green/50" : late ? "border-orange/50" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-fg">{o.code}</span>
                      <span className="text-sm font-semibold text-fg">· {o.tableLabel}</span>
                    </div>
                    <div className="text-xs text-faint">
                      {clock(o.createdAt)} · {mins} dk önce
                      {late && <span className="ml-1 font-semibold text-orange">⏱ gecikiyor</span>}
                      {o.customerName ? ` · ${o.customerName}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[sm.tone]}`}>
                      {sm.label}
                    </span>
                    {pm && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${TONE[pm.tone]}`}>
                        {pm.label}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-2 space-y-1 text-sm">
                  {o.items.map((it) => (
                    <li key={it.id}>
                      <span className="font-medium text-fg">
                        {it.quantity}× {it.name}
                      </span>
                      {it.modifiers.length > 0 && (
                        <span className="text-muted">
                          {" "}
                          ({it.modifiers.map((m) => m.name).join(", ")})
                        </span>
                      )}
                      {it.note && <span className="block text-xs text-orange">↳ {it.note}</span>}
                    </li>
                  ))}
                </ul>
                {o.note && <p className="mt-1 text-xs text-orange">Sipariş notu: {o.note}</p>}

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-bold text-fg">{fmt(o.total)}</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {o.status === "pending" && (
                      <>
                        <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "accepted")} primary>
                          ✅ Kabul
                        </Btn>
                        <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "rejected")}>
                          Reddet
                        </Btn>
                      </>
                    )}
                    {o.status === "accepted" && (
                      <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "preparing")} primary>
                        👨‍🍳 Hazırlanıyor
                      </Btn>
                    )}
                    {o.status === "preparing" && (
                      <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "ready")} primary>
                        🛎 Hazır
                      </Btn>
                    )}
                    {o.status === "ready" && (
                      <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "served")} primary>
                        ✔ Teslim edildi
                      </Btn>
                    )}
                    {(o.status === "accepted" || o.status === "preparing" || o.status === "ready") && (
                      <Btn busy={busy === "st" + o.id} onClick={() => changeStatus(o.id, "cancelled")}>
                        İptal
                      </Btn>
                    )}
                    {o.paymentStatus !== "paid" && o.status !== "cancelled" && o.status !== "rejected" && (
                      <Btn busy={busy === "pay" + o.id} onClick={() => act("pay" + o.id, () => setPaymentStatus(o.id, "paid"))}>
                        ₺ Ödendi
                      </Btn>
                    )}
                    {o.tableId && (o.status === "served" || o.paymentStatus === "paid") && (
                      <Btn
                        busy={busy === "close" + o.id}
                        onClick={() => {
                          if (confirm(`${o.tableLabel} hesabını kapat? (Yeni müşteri için oturum sıfırlanır)`))
                            act("close" + o.id, () => closeTable(o.tableId!));
                        }}
                      >
                        🔒 Masa kapat
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Günlük özet */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 p-4 backdrop-blur">
        <span className="text-sm text-muted">
          Bugün: <strong className="text-fg">{todays.length}</strong> sipariş
        </span>
        <span className="text-sm text-muted">
          Toplam: <strong className="text-fg">{fmt(dailyTotal)}</strong>
        </span>
        <span className="text-sm text-muted">
          Tahsil edilen: <strong className="text-green">{fmt(collected)}</strong>
        </span>
      </div>
    </div>
  );
}

function Btn({
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
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        primary
          ? "bg-green text-black hover:bg-green-dark"
          : "border border-border text-fg hover:border-green/50"
      }`}
    >
      {busy ? "…" : children}
    </button>
  );
}
