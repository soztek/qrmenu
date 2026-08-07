"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_AD_PROMPT,
  VEO_MODELS,
  VIDEO_FORMATS,
  MAX_REFERENCE_IMAGES,
  type VeoModelKey,
} from "@/lib/veo-prompt";

interface Item {
  id: string;
  name: string;
  photoUrl: string | null;
}
interface Category {
  id: string;
  name: string;
  items: Item[];
}
interface Business {
  id: string;
  name: string;
  categories: Category[];
}

type Phase = "idle" | "preparing" | "generating" | "done" | "error";

const STORAGE_KEY = "soztek_advideo_job";
const POLL_MS = 10_000;
const MAX_POLLS = 120; // ~20 dk

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  preparing: "Hazırlanıyor…",
  generating: "Üretiliyor… (1-3 dk sürebilir)",
  done: "Tamamlandı",
  error: "Hata",
};

export function AdVideoStudio({
  businesses,
  aiEnabled,
}: {
  businesses: Business[];
  aiEnabled: boolean;
}) {
  const [businessId, setBusinessId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [refs, setRefs] = useState<{ file: File; url: string }[]>([]);
  const [prompt, setPrompt] = useState(DEFAULT_AD_PROMPT);
  const [format, setFormat] = useState(VIDEO_FORMATS[0].key);
  const [model, setModel] = useState<VeoModelKey>("fast");

  const [phase, setPhase] = useState<Phase>("idle");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [detail, setDetail] = useState<string>("");

  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const polls = useRef(0);

  const business = businesses.find((b) => b.id === businessId) ?? null;
  const category = business?.categories.find((c) => c.id === categoryId) ?? null;
  const product = category?.items.find((i) => i.id === productId) ?? null;
  const productPhoto = product?.photoUrl ?? null;

  const busy = phase === "preparing" || phase === "generating";

  /* Devam eden iş varsa (sayfa yenilenirse) polling'i sürdür */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const job = JSON.parse(raw) as { operationId?: string };
      if (job.operationId) {
        setPhase("generating");
        poll(job.operationId);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  async function poll(operationId: string) {
    polls.current += 1;
    if (polls.current > MAX_POLLS) {
      setPhase("error");
      setError("Video çok uzun sürdü, zaman aşımı. Lütfen tekrar deneyin.");
      localStorage.removeItem(STORAGE_KEY);
      inFlight.current = false;
      return;
    }
    try {
      const res = await fetch(`/api/ai/video/status/${operationId}`);
      const data = await res.json();
      if (data.status === "done" && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setPhase("done");
        localStorage.removeItem(STORAGE_KEY);
        inFlight.current = false;
        return;
      }
      if (data.status === "error") {
        setError(data.error || "Video üretimi başarısız.");
        setDetail(data.detail || "");
        setPhase("error");
        localStorage.removeItem(STORAGE_KEY);
        inFlight.current = false;
        return;
      }
      // generating → tekrar sorgula
      timer.current = setTimeout(() => poll(operationId), POLL_MS);
    } catch {
      // geçici ağ hatası → tekrar dene
      timer.current = setTimeout(() => poll(operationId), POLL_MS);
    }
  }

  function onPickRefs(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    setRefs((prev) => {
      const merged = [...prev];
      for (const f of incoming) {
        if (merged.length >= MAX_REFERENCE_IMAGES) break;
        merged.push({ file: f, url: URL.createObjectURL(f) });
      }
      return merged;
    });
  }

  function removeRef(i: number) {
    setRefs((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  }

  async function onGenerate() {
    if (inFlight.current || busy) return; // çift işlem koruması
    if (!aiEnabled) return;
    if (prompt.trim().length < 10) {
      setError("Lütfen bir video açıklaması (prompt) girin.");
      setPhase("error");
      return;
    }
    inFlight.current = true;
    polls.current = 0;
    stopTimer();
    setError("");
    setDetail("");
    setVideoUrl("");
    setPhase("preparing");

    try {
      const fd = new FormData();
      fd.set("prompt", prompt.trim());
      fd.set("model", model);
      fd.set(
        "aspectRatio",
        VIDEO_FORMATS.find((f) => f.key === format)?.aspectRatio ?? "9:16",
      );
      fd.set("format", format);
      // seçili ürün fotoğrafı da referans olarak kullanılır
      const urls = productPhoto ? [productPhoto] : [];
      fd.set("imageUrls", JSON.stringify(urls));
      for (const r of refs.slice(0, MAX_REFERENCE_IMAGES)) {
        fd.append("refImage", r.file);
      }

      const res = await fetch("/api/ai/video/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.operationId) {
        setError(data.error || "Video başlatılamadı.");
        setDetail(data.detail || "");
        setPhase("error");
        inFlight.current = false;
        return;
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ operationId: data.operationId, ts: Date.now() }),
      );
      setPhase("generating");
      poll(data.operationId);
    } catch {
      setError("Sunucuya ulaşılamadı, tekrar deneyin.");
      setPhase("error");
      inFlight.current = false;
    }
  }

  function reset() {
    stopTimer();
    inFlight.current = false;
    polls.current = 0;
    setPhase("idle");
    setVideoUrl("");
    setError("");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* SOL: ayarlar */}
      <div className="space-y-5">
        {!aiEnabled && (
          <div className="rounded-xl border border-orange/40 bg-orange/10 p-3 text-sm text-fg">
            Video üretimi kapalı. Yönetici <code>GEMINI_API_KEY</code> ekleyince aktifleşir.
          </div>
        )}

        {/* İşletme / kategori / ürün */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="İşletme"
            value={businessId}
            onChange={(v) => {
              setBusinessId(v);
              setCategoryId("");
              setProductId("");
            }}
            options={[
              { value: "", label: "Seçin…" },
              ...businesses.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Select
            label="Kategori"
            value={categoryId}
            disabled={!business}
            onChange={(v) => {
              setCategoryId(v);
              setProductId("");
            }}
            options={[
              { value: "", label: "Tümü / seçin…" },
              ...(business?.categories ?? []).map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Ürün"
            value={productId}
            disabled={!category}
            onChange={setProductId}
            options={[
              { value: "", label: "İsteğe bağlı…" },
              ...(category?.items ?? []).map((i) => ({
                value: i.id,
                label: i.name + (i.photoUrl ? " 📷" : ""),
              })),
            ]}
          />
        </div>

        {productPhoto && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2 text-xs text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productPhoto} alt="" className="h-12 w-12 rounded object-cover" />
            Seçili ürün fotoğrafı referans olarak eklenecek.
          </div>
        )}

        {/* Referans görseller */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">
            Referans görsel (en fazla {MAX_REFERENCE_IMAGES}) — QR menü ekran görüntüsü önerilir
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {refs.map((r, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => removeRef(i)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {refs.length < MAX_REFERENCE_IMAGES && (
              <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-2xl text-muted transition hover:border-green/50">
                +
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickRefs(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Format & model */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Format"
            value={format}
            onChange={setFormat}
            options={VIDEO_FORMATS.map((f) => ({ value: f.key, label: f.label }))}
          />
          <Select
            label="Video modeli"
            value={model}
            onChange={(v) => setModel(v as VeoModelKey)}
            options={VEO_MODELS.map((m) => ({ value: m.key, label: `${m.label} — ${m.hint}` }))}
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Video açıklaması (prompt)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={busy || !aiEnabled}
          className="w-full rounded-xl bg-gradient-to-b from-green to-green-dark py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? PHASE_LABEL[phase] : "🎬 Video Oluştur"}
        </button>
        {busy && (
          <p className="text-center text-xs text-faint">
            İşlem sürerken sayfayı kapatabilirsiniz; geri döndüğünüzde kaldığı yerden devam eder.
          </p>
        )}
      </div>

      {/* SAĞ: durum & çıktı */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-sm font-medium text-muted">Durum</div>

          {phase === "idle" && (
            <p className="mt-2 text-sm text-faint">
              Ayarları yapıp <strong>Video Oluştur</strong>&apos;a basın.
            </p>
          )}

          {(phase === "preparing" || phase === "generating") && (
            <div className="mt-3 flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-green border-t-transparent" />
              <span className="text-sm text-fg">{PHASE_LABEL[phase]}</span>
            </div>
          )}

          {phase === "error" && (
            <div className="mt-3 rounded-lg border border-orange/50 bg-orange-soft/40 p-3 text-sm text-fg">
              {error || "Bir hata oluştu."}
              {detail && (
                <p className="mt-2 break-words rounded bg-black/30 p-2 font-mono text-[11px] leading-snug text-faint">
                  {detail}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-2 block rounded-lg border border-border px-3 py-1.5 text-xs text-fg transition hover:border-green/50"
              >
                Yeniden dene
              </button>
            </div>
          )}

          {phase === "done" && videoUrl && (
            <div className="mt-3 space-y-3">
              <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border border-border bg-black">
                <video src={videoUrl} controls playsInline className="aspect-[9/16] w-full" />
              </div>
              <div className="flex gap-2">
                <a
                  href={videoUrl}
                  download="soztek-reklam.mp4"
                  className="flex-1 rounded-lg bg-green py-2 text-center text-sm font-semibold text-black transition hover:bg-green-dark"
                >
                  ⬇ MP4 indir
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-fg transition hover:border-green/50"
                >
                  Yeni video
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface/60 p-4 text-xs text-muted">
          <p className="font-medium text-fg">İpuçları</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Gerçek QR menü ekran görüntüsünü referans olarak ekleyin — en iyi sonuç için.</li>
            <li>Video üretimi <strong>ücretlidir</strong>; her tıklama bir üretim başlatır.</li>
            <li>Fast modeli hızlı/ekonomik, Quality daha kaliteli ama yavaştır.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-fg">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-green/50 disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
