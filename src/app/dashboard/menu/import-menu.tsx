"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importMenuRows, type ImportRow } from "@/lib/actions/menu";

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20";

/** "120", "₺120,50", "120 TL", "1.250,00" → sayı / null. */
function parsePrice(raw: string): number | null {
  let s = String(raw).replace(/₺|tl/gi, "").replace(/\s/g, "").trim();
  if (!s) return null;
  // Hem "1.250,00" hem "1250.00" biçimlerini destekle
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : null;
}

/** Yapıştırılan metni/CSV'yi hücre matrisine çevirir (tab/;/, ayracı otomatik). */
function parseDelimited(text: string): string[][] {
  const firstBreak = text.indexOf("\n");
  const head = firstBreak >= 0 ? text.slice(0, firstBreak) : text;
  const delim = head.includes("\t")
    ? "\t"
    : head.split(";").length > head.split(",").length
      ? ";"
      : ",";
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Hücre matrisini ürün satırlarına çevirir. Sütun sırası: Kategori | Ürün | Açıklama | Fiyat. */
function rowsToItems(matrix: string[][]): ImportRow[] {
  const out: ImportRow[] = [];
  for (const rawCells of matrix) {
    const cells = rawCells.map((c) => String(c ?? "").trim());
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length < 2) continue;
    const price = parsePrice(cells[cells.length - 1]);
    if (price === null) continue; // başlık satırı ya da fiyatsız → atla
    const category = cells[0] || "Diğer";
    const name = cells[1] || "";
    if (!name) continue;
    const description =
      cells.length >= 4 ? cells.slice(2, -1).join(" ").trim() || null : null;
    out.push({ category, name, description, price });
  }
  return out;
}

/** OCR ile okunan menü metnini ürünlere çevirir (sezgisel: satır sonu fiyat = ürün, fiyatsız kısa satır = kategori). */
function ocrTextToItems(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out: ImportRow[] = [];
  let category = "Menü";
  for (const line of lines) {
    const m = line.match(/([\d][\d.,]*)\s*(?:₺|tl|try)?\s*$/i);
    if (m) {
      const price = parsePrice(m[1]);
      const name = line
        .slice(0, m.index)
        .replace(/[.\-–—:·•\s]+$/g, "")
        .trim();
      if (
        price !== null &&
        price > 0 &&
        name.replace(/[^\p{L}]/gu, "").length >= 2
      ) {
        out.push({ category, name: name.slice(0, 80), description: null, price });
        continue;
      }
    }
    // Rakam içermeyen kısa satır → kategori başlığı
    const letters = line.replace(/[^\p{L}]/gu, "");
    if (letters.length >= 2 && letters.length <= 28 && !/\d/.test(line)) {
      category =
        line
          .replace(/[^\p{L}\s&./-]/gu, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 60) || category;
    }
  }
  return out;
}

type Parsed = { rows: ImportRow[]; source: string };

export function ImportMenu() {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrMsg, setOcrMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImage(file: File) {
    setError(null);
    setResult(null);
    setParsed(null);
    setOcrBusy(true);
    setOcrMsg("Fotoğraf okunuyor… (ilk seferde dil verisi inecek, biraz sürebilir)");
    try {
      const mod = await import("tesseract.js");
      const { data } = await mod.recognize(file, "tur+eng", {
        logger: (m) => {
          if (m.status === "recognizing text")
            setOcrMsg(`Okunuyor… %${Math.round(m.progress * 100)}`);
        },
      });
      const rows = ocrTextToItems(data.text || "");
      if (rows.length === 0) {
        setError(
          "Fotoğraftan ürün okunamadı. Daha net/düz bir fotoğraf deneyin (iyi ışık, dik açı, tek sütun).",
        );
      } else {
        setParsed({ rows, source: "menü fotoğrafı (OCR)" });
      }
    } catch {
      setError("Fotoğraf okunamadı, tekrar deneyin.");
    } finally {
      setOcrBusy(false);
      setOcrMsg(null);
      if (imgRef.current) imgRef.current.value = "";
    }
  }

  function reset() {
    setParsed(null);
    setPaste("");
    setError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    try {
      const name = file.name.toLowerCase();
      let matrix: string[][];
      if (name.endsWith(".csv") || name.endsWith(".txt")) {
        matrix = parseDelimited(await file.text());
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json<string[]>(ws, {
          header: 1,
          raw: false,
          defval: "",
          blankrows: false,
        });
      }
      const rows = rowsToItems(matrix);
      if (rows.length === 0) {
        setError("Dosyada geçerli ürün bulunamadı. Sütun sırası: Kategori · Ürün · Açıklama · Fiyat");
        setParsed(null);
        return;
      }
      setParsed({ rows, source: file.name });
    } catch {
      setError("Dosya okunamadı. .xlsx veya .csv olduğundan emin ol.");
    }
  }

  function handlePaste() {
    setError(null);
    setResult(null);
    const rows = rowsToItems(parseDelimited(paste));
    if (rows.length === 0) {
      setError("Geçerli ürün bulunamadı. Sütun sırası: Kategori · Ürün · Açıklama · Fiyat");
      return;
    }
    setParsed({ rows, source: "yapıştırılan liste" });
  }

  function confirmImport() {
    if (!parsed) return;
    startTransition(async () => {
      const res = await importMenuRows(parsed.rows);
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult(
        `${res.created} ürün eklendi${res.categories ? ` · ${res.categories} yeni kategori oluşturuldu` : ""}.`,
      );
      setParsed(null);
      setPaste("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function downloadTemplate() {
    const rows = [
      ["Kategori", "Ürün", "Açıklama", "Fiyat"],
      ["Sıcak İçecekler", "Türk Kahvesi", "Geleneksel köpüklü", "70"],
      ["Sıcak İçecekler", "Çay", "", "20"],
      ["Tatlılar", "Baklava", "Fındıklı", "160"],
      ["Tatlılar", "Sütlaç", "Fırın sütlaç", "120"],
    ];
    const csv = rows
      .map((r) => r.map((c) => (/[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soztek-menu-sablon.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Önizleme: kategoriye göre grupla
  const groups: { name: string; items: ImportRow[] }[] = [];
  if (parsed) {
    const map = new Map<string, ImportRow[]>();
    for (const r of parsed.rows) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    for (const [name, items] of map) groups.push({ name, items });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
      >
        📊 Excel / CSV içe aktar
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Excel / CSV ile menü yükle</h3>
        <button
          onClick={() => { setOpen(false); reset(); }}
          className="text-sm text-faint hover:text-fg"
        >
          Kapat
        </button>
      </div>

      <p className="mt-2 text-xs text-faint">
        Sütun sırası:{" "}
        <code className="text-muted">Kategori · Ürün · Açıklama · Fiyat</code>. Açıklama
        boş olabilir. İlk satır başlıksa otomatik atlanır. Aynı adlı kategoriler
        birleştirilir, yeni kategoriler otomatik oluşturulur.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark">
          Dosya seç (.xlsx / .csv)
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        <button
          onClick={downloadTemplate}
          className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
        >
          ⬇ Şablon indir
        </button>
        <label
          className={`cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50 ${
            ocrBusy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {ocrBusy ? "Okunuyor…" : "📷 Menü fotoğrafından aktar"}
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={ocrBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
            }}
          />
        </label>
      </div>

      {ocrMsg && <p className="mt-2 text-xs text-muted">{ocrMsg}</p>}
      <p className="mt-1 text-xs text-faint">
        Kağıt menü fotoğrafını yükleyince ürün adları ve fiyatları okunup önizlemeye
        gelir (fotoğraf net olmalı). Okunanları düzeltip içe aktarabilirsin.
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted hover:text-fg">
          veya listeyi yapıştır (Excel'den kopyala-yapıştır)
        </summary>
        <div className="mt-2 space-y-2">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={6}
            placeholder={"Sıcak İçecekler\tTürk Kahvesi\tKöpüklü\t70\nTatlılar\tBaklava\tFındıklı\t160"}
            className={`${inputCls} font-mono`}
          />
          <button
            onClick={handlePaste}
            disabled={!paste.trim()}
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50 disabled:opacity-50"
          >
            Önizle
          </button>
        </div>
      </details>

      {error && <p className="mt-3 text-sm text-orange">{error}</p>}
      {result && (
        <p className="mt-3 rounded-lg border border-green/40 bg-green/10 px-3 py-2 text-sm text-green">
          ✓ {result}
        </p>
      )}

      {parsed && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-sm font-semibold">
            Önizleme — {parsed.rows.length} ürün · {groups.length} kategori{" "}
            <span className="font-normal text-faint">({parsed.source})</span>
          </p>
          <div className="mt-2 max-h-72 space-y-3 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.name}>
                <p className="text-xs font-semibold text-green">
                  {g.name}{" "}
                  <span className="font-normal text-faint">({g.items.length})</span>
                </p>
                <ul className="mt-1 space-y-0.5">
                  {g.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3 text-sm">
                      <span className="truncate text-fg">
                        {it.name}
                        {it.description && (
                          <span className="text-faint"> — {it.description}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-medium text-muted">
                        {it.price.toLocaleString("tr-TR")} ₺
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={confirmImport}
              disabled={pending}
              className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
            >
              {pending ? "Ekleniyor…" : `${parsed.rows.length} ürünü içe aktar`}
            </button>
            <button
              onClick={reset}
              className="text-sm text-faint hover:text-fg"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
