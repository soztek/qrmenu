"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTL } from "@/lib/url";

type Item = { name: string; price: string; photoUrl?: string | null };
type Category = { name: string; items: Item[] };

const THUMB = 68; // ürün küçük resmi (px)

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
const ITEM_H = 92; // fotoğraf sığması için

const BG = "#0b0f14";
const GREEN = "#22c55e";
const ORANGE = "#f97316";
const SLIDE_MS = 6000;
const FADE_MS: number = 500;

type Block =
  | { type: "cat"; text: string }
  | { type: "item"; name: string; price: string; photoUrl?: string | null };
type Slide = Block[][]; // COLS sütun

function buildSlides(categories: Category[]): Slide[] {
  const blocks: Block[] = [];
  for (const c of categories) {
    if (c.items.length === 0) continue;
    blocks.push({ type: "cat", text: c.name });
    for (const it of c.items)
      blocks.push({ type: "item", name: it.name, price: it.price, photoUrl: it.photoUrl });
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

/** Blob (http) görselleri aynı-origin proxy üzerinden; yerel /uploads doğrudan. */
function imgSrc(u: string): string {
  return u.startsWith("http") ? `/api/img?u=${encodeURIComponent(u)}` : u;
}

/** Görseli yuvarlak köşeli, kırparak (cover) çizer. */
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.save();
  ctx.beginPath();
  const rr = (ctx as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void });
  if (typeof rr.roundRect === "function") rr.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  const ar = img.width / img.height;
  const tr = w / h;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ar > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
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
  const [slogan, setSlogan] = useState("");
  const runningRef = useRef(false);

  // Slogan cihazda hatırlansın (işletmeye özel)
  useEffect(() => {
    try {
      const s = localStorage.getItem(`screen_slogan_${slug}`);
      if (s) setSlogan(s);
    } catch {}
  }, [slug]);
  useEffect(() => {
    try {
      localStorage.setItem(`screen_slogan_${slug}`, slogan);
    } catch {}
  }, [slogan, slug]);

  const slides = useMemo(() => buildSlides(categories), [categories]);
  const total = slides.length * SLIDE_MS;
  const durationSec = Math.round(total / 1000);

  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    const urls = [
      ...new Set(
        categories
          .flatMap((c) => c.items)
          .map((i) => i.photoUrl)
          .filter((u): u is string => Boolean(u)),
      ),
    ];
    if (!urls.length) {
      setImagesReady(true);
      return;
    }
    setImagesReady(false);
    let done = 0;
    const map = imagesRef.current;
    const finish = () => {
      if (++done >= urls.length) setImagesReady(true);
    };
    urls.forEach((u) => {
      const img = new window.Image();
      img.onload = () => {
        map.set(u, img);
        finish();
      };
      img.onerror = finish;
      img.src = imgSrc(u);
    });
  }, [categories]);

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
    const cx = W / 2;
    const hasSlogan = slogan.trim().length > 0;
    ctx.textAlign = "center";
    if (hasSlogan) {
      ctx.fillStyle = GREEN;
      ctx.font = "600 30px Arial";
      ctx.fillText(fit(ctx, slogan.trim().toUpperCase(), W - 2 * MX), cx, 64);
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 62px Arial";
    ctx.fillText(fit(ctx, businessName, W - 2 * MX), cx, hasSlogan ? 126 : 114);
    ctx.fillStyle = ORANGE;
    ctx.font = "600 28px Arial";
    ctx.fillText("MENÜ", cx, hasSlogan ? 164 : 154);
    ctx.textAlign = "left";

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
          const img = b.photoUrl ? imagesRef.current.get(b.photoUrl) : null;
          const midY = y + ITEM_H / 2;
          let textX = x;
          if (img) {
            drawRoundedImage(ctx, img, x, y + (ITEM_H - THUMB) / 2, THUMB, THUMB, 12);
            textX = x + THUMB + 20;
          }
          const priceStr = formatTL(b.price);
          ctx.textBaseline = "middle";
          ctx.font = "bold 30px Arial";
          ctx.fillStyle = ORANGE;
          ctx.textAlign = "right";
          ctx.fillText(priceStr, x + COLW, midY);
          const priceW = ctx.measureText(priceStr).width;
          const maxNameW = COLW - (textX - x) - priceW - 24;
          ctx.font = "500 30px Arial";
          ctx.fillStyle = "#e5e7eb";
          ctx.textAlign = "left";
          ctx.fillText(fit(ctx, b.name, maxNameW), textX, midY);
          ctx.textBaseline = "alphabetic";
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
  }, [slides, imagesReady, slogan]);

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
    if (!ctx || busy || runningRef.current || !imagesReady) return;
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
    if (!canvas || !ctx || busy || runningRef.current || !imagesReady) return;
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
      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">
          Slogan (opsiyonel — işletme adının üstünde çıkar)
        </label>
        <input
          value={slogan}
          onChange={(e) => setSlogan(e.target.value.slice(0, 60))}
          maxLength={60}
          placeholder="Örn: ARDAHAN'IN EN KALİTELİ CAFESİ"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-green/50"
        />
      </div>

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
          disabled={busy || !imagesReady}
          className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
        >
          {!imagesReady ? "Görseller yükleniyor…" : busy ? "İşleniyor…" : "🎬 Videoyu oluştur ve indir"}
        </button>
        <button
          onClick={preview}
          disabled={busy || !imagesReady}
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
