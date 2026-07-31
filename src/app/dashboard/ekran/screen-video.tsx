"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTL } from "@/lib/url";

type Item = { name: string; price: string };
type Category = { name: string; items: Item[] };

/* 1920×1080 yerleşim sabitleri */
const W = 1920;
const H = 1080;
const MX = 90;
const HEADER = 190;
const FOOT = 60;
const BODY_TOP = HEADER;
const BODY_H = H - HEADER - FOOT;
const COLS = 2;
const COLGAP = 70;
const COLW = (W - 2 * MX - COLGAP * (COLS - 1)) / COLS;
const CAT_H = 78;
const ITEM_H = 48;

const BG = "#0b0f14";
const GREEN = "#22c55e";
const ORANGE = "#f97316";
const SLIDE_MS = 6000;
const FADE_MS: number = 500;

type Block =
  | { type: "cat"; text: string }
  | { type: "item"; name: string; price: string };
type Slide = Block[][]; // COLS sütun

function buildSlides(categories: Category[]): Slide[] {
  const blocks: Block[] = [];
  for (const c of categories) {
    if (c.items.length === 0) continue;
    blocks.push({ type: "cat", text: c.name });
    for (const it of c.items)
      blocks.push({ type: "item", name: it.name, price: it.price });
  }
  const slides: Slide[] = [];
  let slide: Slide = Array.from({ length: COLS }, () => []);
  let col = 0;
  let y = 0;
  const pushSlide = () => {
    slides.push(slide);
    slide = Array.from({ length: COLS }, () => []);
    col = 0;
    y = 0;
  };
  for (const b of blocks) {
    const h = b.type === "cat" ? CAT_H : ITEM_H;
    // Sütun dolduysa (ya da kategori başlığı dibe düşecekse) sonraki sütun/kare
    const wontFit =
      y + h > BODY_H || (b.type === "cat" && y + CAT_H + ITEM_H > BODY_H);
    if (wontFit && y > 0) {
      col++;
      if (col >= COLS) pushSlide();
      else y = 0;
    }
    slide[col].push(b);
    y += h;
  }
  if (slide.some((c) => c.length)) slides.push(slide);
  return slides;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const cands = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const m of cands) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* yoksay */
    }
  }
  return "";
}

export function ScreenVideo({
  businessName,
  slug,
  categories,
}: {
  businessName: string;
  slug: string;
  categories: Category[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const runningRef = useRef(false);

  const slides = useMemo(() => buildSlides(categories), [categories]);
  const total = slides.length * SLIDE_MS;
  const durationSec = Math.round(total / 1000);

  const drawSlide = (
    ctx: CanvasRenderingContext2D,
    slide: Slide,
    fade: number,
  ) => {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GREEN;
    ctx.fillRect(0, 0, W, 10);

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 66px Arial";
    ctx.fillText(fit(ctx, businessName, W - 2 * MX), MX, 118);
    ctx.fillStyle = ORANGE;
    ctx.font = "600 30px Arial";
    ctx.fillText("MENÜ", MX, 162);

    slide.forEach((colBlocks, ci) => {
      const x = MX + ci * (COLW + COLGAP);
      let y = BODY_TOP + 30;
      for (const b of colBlocks) {
        if (b.type === "cat") {
          ctx.textAlign = "left";
          ctx.fillStyle = GREEN;
          ctx.font = "bold 36px Arial";
          ctx.fillText(fit(ctx, b.text.toUpperCase(), COLW), x, y + 36);
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + 54);
          ctx.lineTo(x + COLW, y + 54);
          ctx.stroke();
          y += CAT_H;
        } else {
          const priceStr = formatTL(b.price);
          ctx.font = "bold 28px Arial";
          ctx.fillStyle = ORANGE;
          ctx.textAlign = "right";
          ctx.fillText(priceStr, x + COLW, y + 30);
          const priceW = ctx.measureText(priceStr).width;
          ctx.font = "500 28px Arial";
          ctx.fillStyle = "#e5e7eb";
          ctx.textAlign = "left";
          ctx.fillText(fit(ctx, b.name, COLW - priceW - 30), x, y + 30);
          y += ITEM_H;
        }
      }
    });

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "24px Arial";
    ctx.fillText("soztekqrmenu.com.tr", MX, H - 28);

    if (fade < 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  };

  const drawAt = (ctx: CanvasRenderingContext2D, t: number) => {
    if (slides.length === 0) return;
    const tt = ((t % total) + total) % total;
    const idx = Math.floor(tt / SLIDE_MS) % slides.length;
    const inSlide = tt - idx * SLIDE_MS;
    const fade = Math.min(1, inSlide / FADE_MS);
    drawSlide(ctx, slides[idx], fade);
  };

  // İlk kareyi çiz (statik önizleme)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAt(ctx, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const animateOnce = (
    ctx: CanvasRenderingContext2D,
    onDone: () => void,
  ) => {
    const t0 = performance.now();
    const step = (now: number) => {
      const t = now - t0;
      drawAt(ctx, t);
      if (t < total + FADE_MS) requestAnimationFrame(step);
      else onDone();
    };
    requestAnimationFrame(step);
  };

  const preview = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || busy || runningRef.current) return;
    runningRef.current = true;
    setBusy(true);
    setStatus("Önizleme oynatılıyor…");
    animateOnce(ctx, () => {
      runningRef.current = false;
      setBusy(false);
      setStatus(null);
      drawAt(ctx, 0);
    });
  };

  const record = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || busy || runningRef.current) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      setStatus("Tarayıcınız video kaydını desteklemiyor. Google Chrome kullanın.");
      return;
    }
    runningRef.current = true;
    setBusy(true);
    setStatus("Video oluşturuluyor… (bu ekranı kapatmayın)");

    try {
      const stream = canvas.captureStream(30);
      const mime = pickMime();
      const rec = new MediaRecorder(
        stream,
        mime
          ? { mimeType: mime, videoBitsPerSecond: 10_000_000 }
          : { videoBitsPerSecond: 10_000_000 },
      );
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      const stopped = new Promise<void>((res) => {
        rec.onstop = () => res();
      });
      rec.start();
      await new Promise<void>((res) => animateOnce(ctx, res));
      rec.stop();
      await stopped;

      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(chunks, { type });
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-ekran-${slug}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(
        `Video indirildi (${ext.toUpperCase()}, ${durationSec} sn, 1920×1080). USB ile TV'ye takıp döngüde oynatabilirsiniz.`,
      );
    } catch {
      setStatus("Video oluşturulamadı, tekrar deneyin (Chrome önerilir).");
    } finally {
      runningRef.current = false;
      setBusy(false);
      drawAt(ctx, 0);
    }
  };

  if (slides.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted">
        Önce menünüze kategori ve ürün ekleyin; ardından ekran videosunu
        oluşturabilirsiniz.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full"
          style={{ aspectRatio: "16 / 9" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={record}
          disabled={busy}
          className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
        >
          {busy ? "İşleniyor…" : "🎬 Videoyu oluştur ve indir"}
        </button>
        <button
          onClick={preview}
          disabled={busy}
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-fg transition hover:border-green/50 disabled:opacity-60"
        >
          ▶ Önizle
        </button>
        <span className="text-xs text-faint">
          {slides.length} kare · ~{durationSec} sn · 1920×1080
        </span>
      </div>

      {status && <p className="text-sm text-muted">{status}</p>}

      <div className="rounded-xl border border-border bg-surface p-4 text-xs text-faint">
        <p className="font-medium text-muted">Nasıl kullanılır?</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            <b>Videoyu oluştur ve indir</b>'e basın — menünüz 1920×1080 döngü video
            olarak iner.
          </li>
          <li>Videoyu bir USB belleğe kopyalayın.</li>
          <li>
            USB'yi TV/dijital ekrana takın, video oynatıcıda açıp{" "}
            <b>tekrar (loop)</b> modunda oynatın.
          </li>
        </ol>
        <p className="mt-2">
          Not: Çoğu TV <b>MP4</b> oynatır. Tarayıcınız MP4 üretemezse WEBM iner;
          bilgisayarda kolayca MP4'e çevirebilir ya da MP4 üreten bir tarayıcı
          (güncel Chrome) kullanabilirsiniz. Menüyü değiştirdikçe videoyu yeniden
          oluşturun.
        </p>
      </div>
    </div>
  );
}
