"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { useLang } from "@/components/lang-provider";
import { LANGS } from "@/lib/i18n";
import { DEMO_MENU_PATH } from "@/lib/seo";

/** WhatsApp iletişim linki (değiştirilmedi). */
const WHATSAPP_HREF =
  "https://wa.me/905368497535?text=Merhaba,%20S%C3%B6ztek%20QR%20Men%C3%BC%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";

/** Ortadaki menü linkleri — anchor'lar aynen korunur. */
const SECTIONS = [
  { id: "ozellikler", key: "features" },
  { id: "nasil", key: "how" },
  { id: "paketler", key: "packages" },
  { id: "sss", key: "faq" },
  { id: "iletisim", key: "contact" },
] as const;

function WhatsappIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.588 5.301l-.999 3.648 3.91-1.026zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function SiteNav() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  /* Scroll → kompakt premium navbar */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Aktif bölüm vurgusu (scroll-spy) */
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Mobil menü açıkken sayfa kaymasın + ESC ile kapansın */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navLabel = (key: string) => t.nav[key as keyof typeof t.nav];

  return (
    <header className="sticky top-0 z-50">
      {/* ── arka plan katmanı: premium gradient + cam + ışık efektleri ── */}
      <div
        className={`absolute inset-0 -z-10 border-b transition-all duration-300 ease-out ${
          scrolled
            ? "border-border/70 bg-[#080b0f]/85 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            : "border-white/5 bg-gradient-to-b from-[#0d1117]/70 to-[#080b0f]/30 backdrop-blur-md"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 left-[14%] h-28 w-64 rounded-full bg-green/10 blur-3xl" />
          <div className="absolute -top-20 right-[16%] h-28 w-64 rounded-full bg-orange/10 blur-3xl" />
        </div>
      </div>

      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 transition-all duration-300 ease-out ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Sol: logo */}
        <div className="flex items-center">
          <div className="transition duration-200 hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.35)]">
            <Logo
              className={`transition-all duration-300 ease-out ${
                scrolled ? "h-9" : "h-10"
              }`}
            />
          </div>
        </div>

        {/* Orta: masaüstü menü */}
        <nav className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`group relative px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 rounded-lg ${
                  isActive ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {navLabel(s.key)}
                <span
                  className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-gradient-to-r from-green to-green-dark transition-all duration-200 ${
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70"
                  }`}
                />
              </a>
            );
          })}
          <Link
            href={DEMO_MENU_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
          >
            {t.nav.demo}
          </Link>
        </nav>

        {/* Sağ: masaüstü aksiyonlar */}
        <div className="hidden items-center gap-2.5 md:flex">
          <LangSwitcher />

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.nav.whatsapp}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#25D366] to-[#1eaf57] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(34,197,94,0.5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_22px_-6px_rgba(34,197,94,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <WhatsappIcon className="h-4 w-4" />
            <span className="hidden lg:inline">{t.nav.whatsapp}</span>
          </a>

          <Link
            href="/giris"
            className="rounded-lg px-2 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50"
          >
            {t.nav.login}
          </Link>

          <Link
            href="/kayit"
            className="rounded-xl bg-gradient-to-b from-green to-green-dark px-4 py-2 text-sm font-semibold text-black shadow-[0_4px_16px_-4px_rgba(34,197,94,0.55)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-6px_rgba(34,197,94,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/60 motion-reduce:transform-none motion-reduce:transition-none"
          >
            {t.nav.tryFree}
          </Link>
        </div>

        {/* Mobil: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t.nav.contact ? "Menü" : "Menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="relative grid h-10 w-10 place-items-center rounded-lg border border-border/70 bg-surface/60 text-fg transition-colors duration-200 hover:border-green/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50 md:hidden"
        >
          <span className="sr-only">Menü</span>
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-fg transition-all duration-300 ease-out ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-fg transition-all duration-200 ease-out ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-fg transition-all duration-300 ease-out ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* ── Mobil menü paneli ── */}
      {/* Arka plan karartma */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 top-0 -z-10 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full origin-top overflow-hidden border-b border-border/70 bg-[#080b0f]/95 backdrop-blur-xl transition-[opacity,transform] duration-300 ease-out md:hidden ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 py-4">
          <div className="flex flex-col">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-base font-medium transition-colors duration-200 ${
                  active === s.id
                    ? "bg-green-soft/40 text-fg"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                {navLabel(s.key)}
              </a>
            ))}
            <Link
              href={DEMO_MENU_PATH}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
            >
              {t.nav.demo}
            </Link>
          </div>

          <div className="my-3 h-px bg-border/60" />

          {/* Dil seçimi (mobil: bayrak satırı) */}
          <div className="flex items-center gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-label={l.label}
                aria-pressed={lang === l.code}
                className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                  lang === l.code
                    ? "border-green/60 bg-green-soft/40 text-fg"
                    : "border-border/70 text-muted hover:text-fg"
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="uppercase">{l.code}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#25D366] to-[#1eaf57] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(34,197,94,0.5)] transition"
            >
              <WhatsappIcon className="h-4 w-4" />
              {t.nav.whatsapp}
            </a>
            <Link
              href="/giris"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border/70 px-4 py-3 text-center text-sm font-medium text-fg transition-colors duration-200 hover:border-green/50"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/kayit"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gradient-to-b from-green to-green-dark px-4 py-3 text-center text-sm font-semibold text-black shadow-[0_4px_16px_-4px_rgba(34,197,94,0.55)] transition"
            >
              {t.nav.tryFree}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
