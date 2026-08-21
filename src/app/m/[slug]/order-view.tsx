"use client";

import { useEffect, useRef, useState } from "react";
import type {
  OrderContext,
  OrderMenuItem,
  OrderModifierGroup,
} from "@/lib/orders/menu";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/orders/types";

/* ── yardımcılar ─────────────────────────────────────── */
function fmt(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: n % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}
const unitOf = (i: OrderMenuItem) => (i.discountPrice ?? i.price);

const TONE: Record<string, string> = {
  muted: "bg-surface-2 text-muted",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  red: "bg-orange-soft text-orange",
};

interface CartLine {
  key: string;
  itemId: string;
  name: string;
  photoUrl: string | null;
  unitPrice: number;
  optionIds: string[];
  optionLabels: { name: string; price: number }[];
  modSum: number;
  qty: number;
  note: string;
}

interface TrackOrder {
  id: string;
  code: string;
  status: OrderStatus;
  total: number;
  tableLabel: string;
  createdAt: string;
  items: { name: string; quantity: number; lineTotal: number; note: string | null }[];
}

export function OrderView({ ctx }: { ctx: OrderContext }) {
  const { business, table, settings, categories } = ctx;
  const cartKey = `qm_cart_${table.token}`;

  const [view, setView] = useState<"menu" | "tracking">("menu");
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState<OrderMenuItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [sessionOrders, setSessionOrders] = useState<TrackOrder[] | null>(null);
  const [ordersSheet, setOrdersSheet] = useState(false);
  const sheetPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [toast, setToast] = useState("");
  const [calling, setCalling] = useState("");

  const idemRef = useRef<string>("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function callService(type: "waiter" | "bill") {
    setCalling(type);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableToken: table.token, type }),
      });
      const data = await res.json();
      setToast(
        res.ok && data.ok
          ? type === "waiter"
            ? "🙋 Garson çağrıldı, geliyor!"
            : "🧾 Hesap talebiniz iletildi!"
          : data.error || "Talep iletilemedi.",
      );
    } catch {
      setToast("Bağlantı hatası, tekrar deneyin.");
    } finally {
      setCalling("");
      setTimeout(() => setToast(""), 3500);
    }
  }

  const serviceBar =
    settings.callWaiter || settings.requestBill ? (
      <div className="flex gap-2">
        {settings.callWaiter && (
          <button
            onClick={() => callService("waiter")}
            disabled={calling === "waiter"}
            className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-fg transition hover:border-green/50 disabled:opacity-50"
          >
            🙋 Garson çağır
          </button>
        )}
        {settings.requestBill && (
          <button
            onClick={() => callService("bill")}
            disabled={calling === "bill"}
            className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-fg transition hover:border-green/50 disabled:opacity-50"
          >
            🧾 Hesap iste
          </button>
        )}
      </div>
    ) : null;

  /* sepeti localStorage ile sakla */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {}
  }, [cart, cartKey]);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + (l.unitPrice + l.modSum) * l.qty, 0);
  const belowMin = settings.minOrderTotal != null && cartTotal < settings.minOrderTotal;

  const cat = categories.find((c) => c.id === activeCat) ?? categories[0];

  function addLine(line: CartLine) {
    setCart((prev) => {
      const sig = line.itemId + "|" + [...line.optionIds].sort().join(",") + "|" + line.note;
      const idx = prev.findIndex(
        (l) => l.itemId + "|" + [...l.optionIds].sort().join(",") + "|" + l.note === sig,
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + line.qty };
        return copy;
      }
      return [...prev, line];
    });
  }
  const setQty = (key: string, d: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l))
        .filter((l) => l.qty > 0),
    );
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));

  async function submit() {
    if (!cart.length || sending || belowMin) return;
    if (!idemRef.current) idemRef.current = crypto.randomUUID();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableToken: table.token,
          idempotencyKey: idemRef.current,
          customerName: customerName.trim() || undefined,
          note: orderNote.trim() || undefined,
          items: cart.map((l) => ({
            menuItemId: l.itemId,
            quantity: l.qty,
            note: l.note || undefined,
            optionIds: l.optionIds,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Sipariş gönderilemedi.");
        return;
      }
      idemRef.current = "";
      setCart([]);
      setCartOpen(false);
      setOrder(data.order);
      setView("tracking");
      startPoll(data.order.id);
    } catch {
      setError("Bağlantı hatası. Sipariş gönderilemedi, tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  function startPoll(id: string) {
    if (pollRef.current) clearTimeout(pollRef.current);
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.ok) setOrder(data.order);
        const st = data.ok ? (data.order.status as OrderStatus) : null;
        if (st && ["served", "cancelled", "rejected"].includes(st)) return; // dur
      } catch {}
      pollRef.current = setTimeout(tick, 7000);
    };
    pollRef.current = setTimeout(tick, 7000);
  }
  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  async function loadSessionOrders() {
    try {
      const res = await fetch(`/api/table/${table.token}/orders`);
      const data = await res.json();
      if (data.ok) setSessionOrders(data.orders);
    } catch {}
  }

  /* Menüye ilk girişte açık siparişleri çek (rozet için) */
  useEffect(() => {
    loadSessionOrders();
    return () => {
      if (sheetPollRef.current) clearInterval(sheetPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openOrdersSheet() {
    setOrdersSheet(true);
    loadSessionOrders();
    if (sheetPollRef.current) clearInterval(sheetPollRef.current);
    sheetPollRef.current = setInterval(loadSessionOrders, 9000);
  }
  function closeOrdersSheet() {
    setOrdersSheet(false);
    if (sheetPollRef.current) {
      clearInterval(sheetPollRef.current);
      sheetPollRef.current = null;
    }
  }

  /* Sekmeye/pencereye dönünce anında güncelle (durum otomatik düşsün) */
  useEffect(() => {
    const onFocus = () => {
      if (document.hidden) return;
      if (view === "tracking" && order) {
        fetch(`/api/orders/${order.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.ok) setOrder(d.order);
          })
          .catch(() => {});
      } else {
        loadSessionOrders();
      }
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, order]);

  /* ── TAKİP EKRANI ── */
  if (view === "tracking" && order) {
    const meta = ORDER_STATUS_META[order.status];
    return (
      <div className="mx-auto min-h-screen w-full max-w-lg bg-bg px-4 py-6">
        {toast && (
          <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg shadow-lg">
            {toast}
          </div>
        )}
        <div className="rounded-2xl border border-green/40 bg-green-soft/20 p-5 text-center">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-2 text-xl font-bold text-fg">Siparişiniz alındı!</h1>
          <p className="mt-1 text-sm text-muted">
            {business.name} · {order.tableLabel}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5">
            <span className="font-mono text-lg font-bold text-fg">{order.code}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[meta.tone]}`}>
              {meta.label}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm font-semibold text-fg">Sipariş özeti</div>
          <ul className="mt-2 divide-y divide-border/60 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-2 py-2">
                <span className="text-fg">
                  {it.quantity}× {it.name}
                  {it.note && <span className="block text-xs text-faint">Not: {it.note}</span>}
                </span>
                <span className="shrink-0 text-muted">{fmt(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-fg">
            <span>Toplam</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setView("menu");
              setOrder(null);
            }}
            className="rounded-xl bg-green py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            ➕ Yeni sipariş ekle
          </button>
          <button
            onClick={loadSessionOrders}
            className="rounded-xl border border-border py-3 text-sm font-semibold text-fg transition hover:border-green/50"
          >
            🧾 Siparişlerim
          </button>
        </div>

        {serviceBar && <div className="mt-3">{serviceBar}</div>}

        {sessionOrders && (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <div className="text-sm font-semibold text-fg">Bu masadaki siparişler</div>
            <ul className="mt-2 space-y-2 text-sm">
              {sessionOrders.length === 0 && (
                <li className="text-faint">Kayıt yok.</li>
              )}
              {sessionOrders.map((o) => {
                const m = ORDER_STATUS_META[o.status];
                return (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-fg">{o.code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${TONE[m.tone]}`}>
                      {m.label}
                    </span>
                    <span className="text-muted">{fmt(o.total)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 border-t border-border pt-2 text-right text-sm font-bold text-fg">
              Masa toplamı:{" "}
              {fmt(sessionOrders.reduce((s, o) => s + o.total, 0))}
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-faint">
          Durum otomatik güncellenir. Sayfayı kapatmayın.
        </p>
      </div>
    );
  }

  /* ── MENÜ / SİPARİŞ EKRANI ── */
  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-bg pb-24">
      {toast && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg shadow-lg">
          {toast}
        </div>
      )}
      {/* Başlık */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="text-xs text-green">{business.name}</div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-fg">Sipariş — {table.label}</h1>
          {sessionOrders && sessionOrders.length > 0 && (
            <button
              onClick={openOrdersSheet}
              className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-fg transition hover:bg-surface"
            >
              🧾 Siparişlerim ({sessionOrders.length})
            </button>
          )}
        </div>
        {/* Kategori sekmeleri */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                activeCat === c.id
                  ? "bg-green font-semibold text-black"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {serviceBar && <div className="mt-2">{serviceBar}</div>}
      </div>

      {/* Ürünler */}
      <div className="space-y-2.5 p-4">
        {cat?.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-2xl border border-border bg-surface p-2.5"
          >
            {item.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photoUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold uppercase text-fg">{item.name}</div>
              {item.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</p>
              )}
              <div className="mt-1 flex items-center gap-2">
                {item.discountPrice != null ? (
                  <>
                    <span className="font-bold text-green">{fmt(item.discountPrice)}</span>
                    <span className="text-xs text-faint line-through">{fmt(item.price)}</span>
                  </>
                ) : (
                  <span className="font-bold text-fg">{fmt(item.price)}</span>
                )}
                {item.prepMinutes ? (
                  <span className="text-xs text-faint">· ~{item.prepMinutes} dk</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-end">
              {item.orderable ? (
                <button
                  onClick={() => setModalItem(item)}
                  className="rounded-lg bg-green px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-green-dark"
                >
                  Ekle
                </button>
              ) : (
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-faint">
                  Tükendi
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sepet çubuğu */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg items-center justify-between bg-green px-5 py-4 text-black shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.5)]"
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/20 text-sm">
              {cartCount}
            </span>
            Sepeti gör
          </span>
          <span className="font-bold">{fmt(cartTotal)}</span>
        </button>
      )}

      {/* Siparişlerim (canlı) */}
      {ordersSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={closeOrdersSheet}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">Siparişlerim — {table.label}</h2>
              <button onClick={closeOrdersSheet} className="text-2xl leading-none text-muted">
                ×
              </button>
            </div>
            {!sessionOrders || sessionOrders.length === 0 ? (
              <p className="py-8 text-center text-muted">Bu masada henüz sipariş yok.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {sessionOrders.map((o) => {
                    const m = ORDER_STATUS_META[o.status];
                    return (
                      <li key={o.id} className="rounded-xl border border-border bg-bg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-fg">{o.code}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[m.tone]}`}>
                            {m.label}
                          </span>
                        </div>
                        <ul className="mt-1 text-sm text-muted">
                          {o.items.map((it, i) => (
                            <li key={i}>
                              {it.quantity}× {it.name}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-1 text-right text-sm font-semibold text-fg">
                          {fmt(o.total)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold text-fg">
                  <span>Masa toplamı</span>
                  <span>{fmt(sessionOrders.reduce((s, o) => s + o.total, 0))}</span>
                </div>
              </>
            )}
            <p className="mt-2 text-center text-xs text-faint">Durum otomatik güncellenir.</p>
            <button
              onClick={closeOrdersSheet}
              className="mt-3 w-full rounded-xl bg-green py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
            >
              Menüye dön
            </button>
          </div>
        </div>
      )}

      {/* Seçenek modalı */}
      {modalItem && (
        <ItemModal
          item={modalItem}
          allowNotes={settings.allowNotes}
          onClose={() => setModalItem(null)}
          onAdd={(line) => {
            addLine(line);
            setModalItem(null);
          }}
        />
      )}

      {/* Sepet çekmecesi */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          belowMin={belowMin}
          minTotal={settings.minOrderTotal}
          askName={settings.askCustomerName}
          allowNotes={settings.allowNotes}
          customerName={customerName}
          setCustomerName={setCustomerName}
          orderNote={orderNote}
          setOrderNote={setOrderNote}
          sending={sending}
          error={error}
          onClose={() => setCartOpen(false)}
          setQty={setQty}
          removeLine={removeLine}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

/* ── Seçenek modalı ── */
function ItemModal({
  item,
  allowNotes,
  onClose,
  onAdd,
}: {
  item: OrderMenuItem;
  allowNotes: boolean;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  function toggle(g: OrderModifierGroup, oid: string) {
    setSel((prev) => {
      const cur = prev[g.id] ?? [];
      let next: string[];
      if (g.maxSelect <= 1) {
        next = cur.includes(oid) && !g.required ? [] : [oid];
      } else if (cur.includes(oid)) {
        next = cur.filter((x) => x !== oid);
      } else {
        next = cur.length >= g.maxSelect ? cur : [...cur, oid];
      }
      return { ...prev, [g.id]: next };
    });
  }

  const optionIds = Object.values(sel).flat();
  const chosen = item.groups.flatMap((g) =>
    g.options.filter((o) => (sel[g.id] ?? []).includes(o.id)).map((o) => ({ name: o.name, price: o.priceDelta })),
  );
  const modSum = chosen.reduce((s, o) => s + o.price, 0);
  const lineUnit = unitOf(item) + modSum;

  function add() {
    for (const g of item.groups) {
      const n = (sel[g.id] ?? []).length;
      const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
      if (n < min) {
        setErr(`"${g.name}" için seçim yapın.`);
        return;
      }
    }
    onAdd({
      key: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      photoUrl: item.photoUrl,
      unitPrice: unitOf(item),
      optionIds,
      optionLabels: chosen,
      modSum,
      qty,
      note: note.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold uppercase text-fg">{item.name}</h2>
            {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted">
            ×
          </button>
        </div>

        {item.groups.map((g) => (
          <div key={g.id} className="mt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-fg">
              {g.name}
              {g.required && (
                <span className="rounded bg-orange-soft px-1.5 py-0.5 text-[10px] text-orange">
                  Zorunlu
                </span>
              )}
              <span className="text-xs font-normal text-faint">
                {g.maxSelect > 1 ? `en fazla ${g.maxSelect}` : "birini seç"}
              </span>
            </div>
            <div className="mt-1.5 space-y-1.5">
              {g.options.map((o) => {
                const checked = (sel[g.id] ?? []).includes(o.id);
                return (
                  <button
                    key={o.id}
                    disabled={!o.available}
                    onClick={() => toggle(g, o.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
                      checked ? "border-green bg-green-soft/40 text-fg" : "border-border text-muted"
                    } disabled:opacity-40`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          checked ? "border-green bg-green text-black" : "border-border"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      {o.name}
                      {!o.available && " (yok)"}
                    </span>
                    {o.priceDelta > 0 && <span className="text-fg">+{fmt(o.priceDelta)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {allowNotes && (
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-fg">Not (isteğe bağlı)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Az pişmiş, soğansız"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            />
          </div>
        )}

        {err && <p className="mt-2 text-sm text-orange">{err}</p>}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border px-2 py-1.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2 text-lg text-fg">
              −
            </button>
            <span className="w-5 text-center font-semibold text-fg">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="px-2 text-lg text-fg">
              +
            </button>
          </div>
          <button
            onClick={add}
            className="flex-1 rounded-xl bg-green py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Sepete ekle · {fmt(lineUnit * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sepet çekmecesi ── */
function CartDrawer({
  cart,
  total,
  belowMin,
  minTotal,
  askName,
  allowNotes,
  customerName,
  setCustomerName,
  orderNote,
  setOrderNote,
  sending,
  error,
  onClose,
  setQty,
  removeLine,
  onSubmit,
}: {
  cart: CartLine[];
  total: number;
  belowMin: boolean;
  minTotal: number | null;
  askName: boolean;
  allowNotes: boolean;
  customerName: string;
  setCustomerName: (v: string) => void;
  orderNote: string;
  setOrderNote: (v: string) => void;
  sending: boolean;
  error: string;
  onClose: () => void;
  setQty: (key: string, d: number) => void;
  removeLine: (key: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-fg">Sepetim</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <p className="py-8 text-center text-muted">Sepetiniz boş.</p>
        ) : (
          <ul className="space-y-3">
            {cart.map((l) => (
              <li key={l.key} className="flex gap-3 border-b border-border/60 pb-3">
                {l.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-fg">{l.name}</div>
                  {l.optionLabels.length > 0 && (
                    <div className="text-xs text-muted">
                      {l.optionLabels.map((o) => o.name).join(", ")}
                    </div>
                  )}
                  {l.note && <div className="text-xs text-faint">Not: {l.note}</div>}
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-border px-1.5 py-0.5">
                      <button onClick={() => setQty(l.key, -1)} className="px-1.5 text-fg">−</button>
                      <span className="w-4 text-center text-sm font-semibold text-fg">{l.qty}</span>
                      <button onClick={() => setQty(l.key, 1)} className="px-1.5 text-fg">+</button>
                    </div>
                    <button
                      onClick={() => removeLine(l.key)}
                      className="text-xs text-faint hover:text-orange"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
                <div className="shrink-0 font-semibold text-fg">
                  {fmt((l.unitPrice + l.modSum) * l.qty)}
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.length > 0 && (
          <>
            {askName && (
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Adınız (isteğe bağlı)"
                className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            )}
            {allowNotes && (
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                rows={2}
                placeholder="Sipariş notu (isteğe bağlı)"
                className="mt-2 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
            )}

            <div className="mt-3 flex items-center justify-between text-lg font-bold text-fg">
              <span>Toplam</span>
              <span>{fmt(total)}</span>
            </div>
            {belowMin && minTotal != null && (
              <p className="mt-1 text-sm text-orange">
                Minimum sipariş tutarı {fmt(minTotal)}. Lütfen ürün ekleyin.
              </p>
            )}
            {error && <p className="mt-1 text-sm text-orange">{error}</p>}

            <button
              onClick={onSubmit}
              disabled={sending || belowMin}
              className="mt-3 w-full rounded-xl bg-gradient-to-b from-green to-green-dark py-3.5 text-base font-bold text-black transition hover:brightness-105 disabled:opacity-50"
            >
              {sending ? "Gönderiliyor…" : `Siparişi Gönder · ${fmt(total)}`}
            </button>
            <p className="mt-2 text-center text-xs text-faint">
              Fiyatlar işletme tarafından onaylanır. Sipariş masanıza iletilir.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
