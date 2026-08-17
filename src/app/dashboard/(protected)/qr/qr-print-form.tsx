"use client";

import { useState } from "react";

export function QrPrintForm() {
  const [count, setCount] = useState(5);
  const [size, setSize] = useState("m");
  const [style, setStyle] = useState("stand");
  const [text, setText] = useState(
    "Menümüz artık dijital! QR'ı okutun, menümüzü telefonunuzdan görün.",
  );

  function open() {
    const c = Math.min(60, Math.max(1, count || 1));
    const params = new URLSearchParams({
      count: String(c),
      size,
      style,
    });
    if (style === "stand" && text.trim()) params.set("text", text.trim());
    window.open(`/qr-yazdir?${params.toString()}`, "_blank");
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-lg font-bold text-fg">Çoklu / masa standı baskısı</h2>
      <p className="mt-1 text-sm text-muted">
        Kaç masan varsa o kadar QR&apos;ı tek sayfada yazdır. İstersen masa standı (pleksi) kartı
        olarak reklam metniyle bas.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Adet (masa sayısı)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">QR boyutu</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          >
            <option value="s">Küçük (~4 cm)</option>
            <option value="m">Orta (~5.5 cm)</option>
            <option value="l">Büyük (~7.5 cm)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Stil</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          >
            <option value="stand">Masa standı kartı (reklam metinli)</option>
            <option value="qr">Sadece QR (etiket/sticker)</option>
          </select>
        </div>
      </div>

      {style === "stand" && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-fg">
            Reklam / bilgi metni (standın üstünde yazacak)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={160}
            className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          />
        </div>
      )}

      <button
        type="button"
        onClick={open}
        className="mt-4 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
      >
        Baskı önizlemesini aç →
      </button>
      <p className="mt-2 text-xs text-faint">
        Açılan sayfada “Yazdır / PDF kaydet” ile yazıcıya gönderebilir ya da PDF alabilirsin.
      </p>
    </div>
  );
}
