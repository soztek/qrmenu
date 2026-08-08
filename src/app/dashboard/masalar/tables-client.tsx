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
  const [count, setCount] = useState(1);

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
      {/* Ekleme — tek alan: ad + adet */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <label className="mb-1.5 block text-sm font-medium text-fg">Masa ekle</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Masa adı / bölge — örn: ÖN BAHÇE ya da Masa"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted">Adet</span>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
            />
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              run("add", async () => {
                const name = newLabel.trim();
                if (!name) return { ok: false, error: "Masa adı gerekli." };
                const r =
                  count > 1
                    ? await createTablesBulk(name, count)
                    : await createTable(name);
                if (r.ok) {
                  setNewLabel("");
                  setCount(1);
                }
                return r;
              })
            }
            className="rounded-lg bg-green px-5 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
        <p className="mt-2 text-xs text-faint">
          Adet 1&apos;den fazlaysa <strong>“{(newLabel.trim() || "ÖN BAHÇE")} 1”</strong>,{" "}
          <strong>“{(newLabel.trim() || "ÖN BAHÇE")} 2”</strong>… şeklinde numaralı oluşturulur.
          Tek masa için adet 1 bırakın.
        </p>
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
