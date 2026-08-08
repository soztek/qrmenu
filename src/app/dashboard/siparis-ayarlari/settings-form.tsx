"use client";

import { useState } from "react";
import { updateOrderSettings, type OrderSettingsInput } from "@/lib/actions/order-settings";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-3">
      <span className="text-sm">
        <span className="font-medium text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-faint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-green"
      />
    </label>
  );
}

export function OrderSettingsForm({ initial }: { initial: OrderSettingsInput }) {
  const [s, setS] = useState<OrderSettingsInput>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const set = <K extends keyof OrderSettingsInput>(k: K, v: OrderSettingsInput[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setNote("");
    try {
      const res = await updateOrderSettings(s);
      setNote(res.ok ? "Ayarlar kaydedildi." : res.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Ana anahtar */}
      <div
        className={`rounded-2xl border p-4 ${
          s.qrOrderingEnabled ? "border-green/50 bg-green-soft/20" : "border-border bg-surface"
        }`}
      >
        <Toggle
          label="QR ile masadan sipariş"
          hint="Açıkken müşteriler masa QR'ını okutup sipariş verebilir. Kapalıyken sadece menü görünür."
          checked={s.qrOrderingEnabled}
          onChange={(v) => set("qrOrderingEnabled", v)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 text-sm font-semibold text-fg">Sipariş akışı</div>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Sipariş kabul modu</label>
            <select
              value={s.acceptMode}
              onChange={(e) => set("acceptMode", e.target.value as "staff" | "auto")}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            >
              <option value="staff">Personel onaylı (önce sen kabul et)</option>
              <option value="auto">Otomatik (doğrudan mutfağa)</option>
            </select>
          </div>
          <Toggle label="Stok kontrolü" hint="Stok biten ürün sipariş edilemesin." checked={s.stockControl} onChange={(v) => set("stockControl", v)} />
          <Toggle label="Mutfak ekranı" checked={s.kitchenEnabled} onChange={(v) => set("kitchenEnabled", v)} />
          <Toggle label="Bildirim sesi" checked={s.soundEnabled} onChange={(v) => set("soundEnabled", v)} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 text-sm font-semibold text-fg">Müşteri seçenekleri</div>
        <div className="space-y-3">
          <Toggle label="Garson çağır" checked={s.callWaiterEnabled} onChange={(v) => set("callWaiterEnabled", v)} />
          <Toggle label="Hesap iste" checked={s.requestBillEnabled} onChange={(v) => set("requestBillEnabled", v)} />
          <Toggle label="Müşteri adı iste" hint="Sipariş verirken isim (opsiyonel) sorulsun." checked={s.askCustomerName} onChange={(v) => set("askCustomerName", v)} />
          <Toggle label="Sipariş notları" hint="Müşteri ürüne/siparişe not yazabilsin." checked={s.allowNotes} onChange={(v) => set("allowNotes", v)} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 text-sm font-semibold text-fg">Kurallar</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Min. sipariş (₺)</label>
            <input
              value={s.minOrderTotal ?? ""}
              onChange={(e) => set("minOrderTotal", e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Sipariş başlangıç</label>
            <input
              type="time"
              value={s.acceptFrom ?? ""}
              onChange={(e) => set("acceptFrom", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Sipariş bitiş</label>
            <input
              type="time"
              value={s.acceptTo ?? ""}
              onChange={(e) => set("acceptTo", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-faint">Saat boş bırakılırsa her zaman sipariş alınır.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-gradient-to-b from-green to-green-dark px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {note && <span className="text-sm text-muted">{note}</span>}
      </div>
    </div>
  );
}
