"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTable,
  createTablesBulk,
  renameTable,
  deleteTable,
  regenerateTableToken,
  setTableActive,
} from "@/lib/actions/tables";

interface TableRow {
  id: string;
  label: string;
  active: boolean;
  orderUrl: string;
  qr: string;
}

export function TablesClient({ tables, slug }: { tables: TableRow[]; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("Masa");
  const [bulkCount, setBulkCount] = useState(10);

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    setErr("");
    try {
      const res = await fn();
      if (!res.ok) setErr(res.error ?? "İşlem başarısız.");
      else router.refresh();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Ekleme */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Tek masa ekle</label>
            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Örn: Bahçe 3"
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  run("add", async () => {
                    const r = await createTable(newLabel);
                    if (r.ok) setNewLabel("");
                    return r;
                  })
                }
                className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-50"
              >
                Ekle
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Toplu ekle</label>
            <div className="flex gap-2">
              <input
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value)}
                className="w-28 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
              <input
                type="number"
                min={1}
                max={50}
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
              />
              <button
                type="button"
                disabled={!!busy}
                onClick={() => run("bulk", () => createTablesBulk(bulkPrefix, bulkCount))}
                className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50 disabled:opacity-50"
              >
                {bulkCount} masa
              </button>
            </div>
          </div>
        </div>
        {err && <p className="mt-2 text-sm text-orange">{err}</p>}
      </div>

      {tables.length > 0 && (
        <a
          href={`/qr-yazdir?mode=tables`}
          target="_blank"
          className="inline-block rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          🖨️ Tüm masa QR standlarını yazdır
        </a>
      )}

      {/* Liste */}
      {tables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Henüz masa yok. Yukarıdan ekleyin.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`flex gap-3 rounded-xl border bg-surface p-3 ${
                t.active ? "border-border" : "border-orange/40 opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.qr} alt="" className="h-24 w-24 shrink-0 rounded-lg bg-white p-1" />
              <div className="min-w-0 flex-1">
                <input
                  defaultValue={t.label}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== t.label) {
                      run("rename" + t.id, () => renameTable(t.id, e.target.value));
                    }
                  }}
                  className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-fg outline-none hover:border-border focus:border-green/50"
                />
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(t.orderUrl)}
                    className="rounded border border-border px-2 py-1 text-muted transition hover:text-fg"
                  >
                    Linki kopyala
                  </button>
                  <a
                    href={t.qr}
                    download={`${slug}-${t.label}.png`}
                    className="rounded border border-border px-2 py-1 text-muted transition hover:text-fg"
                  >
                    QR indir
                  </a>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => {
                      if (confirm("QR yenilenecek, eski QR geçersiz olacak. Devam?"))
                        run("regen" + t.id, () => regenerateTableToken(t.id));
                    }}
                    className="rounded border border-border px-2 py-1 text-muted transition hover:text-fg"
                  >
                    QR yenile
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run("active" + t.id, () => setTableActive(t.id, !t.active))}
                    className="rounded border border-border px-2 py-1 text-muted transition hover:text-fg"
                  >
                    {t.active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => {
                      if (confirm("Masa silinsin mi? (Geçmiş siparişler korunur)"))
                        run("del" + t.id, () => deleteTable(t.id));
                    }}
                    className="rounded border border-border px-2 py-1 text-muted transition hover:border-orange/50 hover:text-fg"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
