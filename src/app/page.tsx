"use client";

import Link from "next/link";
import { PLANS, TRIAL_DAYS, formatPrice, type PlanId } from "@/lib/plans";
import { COMPANY } from "@/lib/company";
import { Logo } from "@/components/logo";
import { VisitTracker } from "@/components/visit-tracker";
import { PaymentLogos } from "@/components/payment-logos";
import { LangProvider, useLang } from "@/components/lang-provider";
import { SiteNav } from "@/components/site-nav";

/** {n} yer tutucusunu deneme gün sayısıyla değiştirir. */
function withDays(s: string) {
  return s.replace("{n}", String(TRIAL_DAYS));
}

/* ── küçük ikonlar (bağımlılık yok) ───────────────────────────── */
function Icon({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path.split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const ICONS = {
  qr: "M4 4h6v6H4z|M14 4h6v6h-6z|M4 14h6v6H4z|M14 14h2v2h-2z|M18 14h2v2h-2z|M14 18h2v2h-2z|M18 18h2v2h-2z",
  photo:
    "M3 5h18v14H3z|M3 15l5-5 4 4 3-3 6 6|M8.5 9a1 1 0 100-2 1 1 0 000 2z",
  orders:
    "M6 2l1.5 3h9L18 2|M5 5h14l-1.5 12a2 2 0 01-2 2H8.5a2 2 0 01-2-2z|M9 11h6",
  tables: "M4 10h16|M6 10v9|M18 10v9|M5 6h14l1 4H4z",
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18z|M3 12h18|M12 3c2.5 2.5 2.5 15 0 18|M12 3c-2.5 2.5-2.5 15 0 18",
  check: "M20 6L9 17l-5-5",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
} as const;

/** Özellik ve uyumluluk kartlarının ikonları (metin sözlükten gelir, ikon burada). */
const FEATURE_ICONS = [
  ICONS.qr,
  ICONS.photo,
  ICONS.orders,
  ICONS.tables,
  ICONS.globe,
  ICONS.bolt,
];
const COMPLIANCE_ICONS = ["🔥", "⚠️", "🥩", "🚫", "₺", "🖨️"];

/* ── sayfa ────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <LangProvider>
      <VisitTracker kind="landing" />
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <PhotoMarquee />
        <Problems />
        <Features />
        <HowItWorks />
        <Compliance />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </LangProvider>
  );
}

/* ── hero ─────────────────────────────────────────────────────── */
function Hero() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 0%, rgba(34,197,94,.14), transparent 60%), radial-gradient(500px 300px at 90% 20%, rgba(249,115,22,.12), transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            {withDays(t.hero.badge)}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t.hero.titleBefore}
            <span className="brand-gradient-text">{t.hero.titleHighlight}</span>
            {t.hero.titleAfter}
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/kayit"
              className="rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
            >
              {t.hero.ctaPrimary}
            </Link>
            <a
              href="#nasil"
              className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg transition hover:border-green/50"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.check} className="h-4 w-4 text-green" />{" "}
              {t.hero.check1}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.check} className="h-4 w-4 text-green" />{" "}
              {t.hero.check2}
            </span>
          </div>
        </div>

        <PhoneMock />
      </div>
    </section>
  );
}

/* Telefon içinde gerçek Söztek QR Menü ekran görüntüsü */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="brand-glow rounded-[2.2rem] border border-border bg-surface p-3">
        <div className="overflow-hidden rounded-[1.7rem] bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/menu-preview.jpeg"
            alt="Söztek QR Menü — gerçek bir işletme menüsü"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}

/* ── güven şeridi ─────────────────────────────────────────────── */
function TrustStrip() {
  const { t } = useLang();
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5">
        {t.trust.items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <Icon path={ICONS.check} className="h-4 w-4 shrink-0 text-green" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── problem / çözüm ──────────────────────────────────────────── */
function Problems() {
  const { t } = useLang();
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead eyebrow={t.problems.eyebrow} title={t.problems.title} subtitle="" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.problems.items.map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-orange">
                <span aria-hidden>✕</span>
                {p.problem}
              </p>
              <div className="my-3 h-px bg-border/60" />
              <p className="flex items-start gap-2 text-sm text-fg">
                <Icon path={ICONS.check} className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                <span className="text-muted">{p.solution}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── SSS ──────────────────────────────────────────────────────── */
function Faq() {
  const { t } = useLang();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="sss" className="border-t border-border/60 bg-surface/40 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-3xl px-5">
        <SectionHead
          eyebrow={t.faq.eyebrow}
          title={t.faq.title}
          subtitle={t.faq.subtitle}
        />
        <div className="mt-10 space-y-3">
          {t.faq.items.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border bg-surface px-5 open:border-green/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/50">
                {f.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── animasyonlu fotoğraf şeridi ──────────────────────────────── */
function PhotoMarquee() {
  const { t } = useLang();
  const photos = [
    "food-burger.png",
    "food-cake.png",
    "food-salad.webp",
    "food-coffee.png",
    "food-latte.png",
  ];
  return (
    <section className="overflow-hidden border-y border-border/60 bg-surface/30 py-8">
      <div className="mb-5 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-green">
          {t.marquee.eyebrow}
        </span>
        <p className="mt-1 text-lg font-semibold text-fg">{t.marquee.title}</p>
      </div>
      {/* İki kopya yan yana → kesintisiz kayan bant */}
      <div className="marquee-track flex w-max gap-4">
        {[...photos, ...photos].map((n, i) => (
          <a
            key={i}
            href="#paketler"
            aria-label={t.nav.packages}
            className="block h-40 w-60 shrink-0 overflow-hidden rounded-2xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/landing/${n}`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── özellikler ───────────────────────────────────────────────── */
function Features() {
  const { t } = useLang();
  return (
    <section id="ozellikler" className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow={t.features.eyebrow}
          title={t.features.title}
          subtitle={t.features.subtitle}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-green/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-soft text-green transition group-hover:bg-green group-hover:text-black">
                <Icon path={FEATURE_ICONS[i]} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── nasıl çalışır ────────────────────────────────────────────── */
function HowItWorks() {
  const { t } = useLang();
  return (
    <section id="nasil" className="border-t border-border/60 bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow={t.how.eyebrow}
          title={t.how.title}
          subtitle={t.how.subtitle}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.how.steps.map((s, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-green to-orange font-bold text-black">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{withDays(s.desc)}</p>
              {i < t.how.steps.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden text-border md:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── yasal uyumluluk ──────────────────────────────────────────── */
function Compliance() {
  const { t } = useLang();
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow={t.compliance.eyebrow}
          title={t.compliance.title}
          subtitle={t.compliance.subtitle}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.compliance.items.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="text-2xl">{COMPLIANCE_ICONS[i]}</div>
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-faint">
          {t.compliance.footnote}
        </p>
      </div>
    </section>
  );
}

/* ── fiyatlandırma ────────────────────────────────────────────── */
function Pricing() {
  const { t } = useLang();
  return (
    <section id="paketler" className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow={t.pricing.eyebrow}
          title={t.pricing.title}
          subtitle={withDays(t.pricing.subtitle)}
        />
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const tp = t.plans[plan.id as PlanId];
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  plan.popular
                    ? "border-green bg-surface brand-glow"
                    : "border-border bg-surface"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-orange px-3 py-1 text-xs font-semibold text-black">
                    {t.pricing.popular}
                  </span>
                )}
                <h3 className="font-semibold">{tp.name}</h3>
                <p className="mt-1 text-sm text-muted">{tp.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">
                    {formatPrice(plan.priceMonthly)}
                  </span>
                  <span className="text-sm text-faint">{t.pricing.perMonth}</span>
                </div>
                <Link
                  href={`/kayit?plan=${plan.id}`}
                  className={`mt-6 rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                    plan.popular
                      ? "bg-green text-black hover:bg-green-dark"
                      : "border border-border text-fg hover:border-green/50"
                  }`}
                >
                  {withDays(t.pricing.cta)}
                </Link>
                <ul className="mt-6 space-y-3 text-sm">
                  {tp.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <Icon
                        path={ICONS.check}
                        className="mt-0.5 h-4 w-4 shrink-0 text-green"
                      />
                      <span className="text-muted">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── son CTA ──────────────────────────────────────────────────── */
function FinalCta() {
  const { t } = useLang();
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-14"
          style={{
            background:
              "radial-gradient(500px 220px at 50% 0%, rgba(34,197,94,.16), transparent 70%), var(--color-surface)",
          }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t.finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            {withDays(t.finalCta.subtitle)}
          </p>
          <Link
            href="/kayit"
            className="mt-8 inline-block rounded-lg bg-green px-8 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            {t.finalCta.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── footer ───────────────────────────────────────────────────── */
function Footer() {
  const { t } = useLang();
  return (
    <footer id="iletisim" className="border-t border-border/60 pt-14 pb-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marka */}
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{t.footer.brandDesc}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <Link href="/giris" className="text-muted transition hover:text-fg">
                {t.footer.login}
              </Link>
              <Link href="/kayit" className="text-muted transition hover:text-fg">
                {t.footer.register}
              </Link>
              <a href="#paketler" className="text-muted transition hover:text-fg">
                {t.footer.packages}
              </a>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-fg">
              {t.footer.contactTitle}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href={`tel:${COMPANY.phoneRaw}`} className="transition hover:text-green">
                  {t.footer.telFax}: {COMPANY.phone}
                </a>
              </li>
              <li>
                <a href={`tel:${COMPANY.gsmRaw}`} className="transition hover:text-green">
                  {t.footer.gsm}: {COMPANY.gsm}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="transition hover:text-green">
                  {COMPANY.email}
                </a>
              </li>
              <li>
                <a
                  href={COMPANY.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-green"
                >
                  {COMPANY.website}
                </a>
              </li>
            </ul>
          </div>

          {/* Firma / yasal */}
          <div>
            <h3 className="text-sm font-semibold text-fg">{t.footer.company}</h3>
            <div className="mt-3 space-y-1.5 text-sm text-muted">
              <p className="font-medium text-fg/90">{COMPANY.legalName}</p>
              <p>{COMPANY.address}</p>
              <p>
                {t.footer.taxOffice}: {COMPANY.taxOffice} · {t.footer.taxNo}:{" "}
                {COMPANY.taxNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Güvenli ödeme */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
          <span className="text-xs text-faint">{t.footer.securePayment}</span>
          <PaymentLogos />
        </div>

        {/* Yasal sayfalar */}
        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-border/60 pt-6 text-sm">
          <Link href="/hakkimizda" className="text-muted transition hover:text-green">
            {t.footer.about}
          </Link>
          <Link href="/gizlilik" className="text-muted transition hover:text-green">
            {t.footer.privacy}
          </Link>
          <Link
            href="/mesafeli-satis-sozlesmesi"
            className="text-muted transition hover:text-green"
          >
            {t.footer.distanceSales}
          </Link>
          <Link href="/teslimat-iade" className="text-muted transition hover:text-green">
            {t.footer.delivery}
          </Link>
        </nav>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-faint md:flex-row">
          <p>
            © {new Date().getFullYear()} {COMPANY.shortName}. {t.footer.rights}
          </p>
          <p className="italic">“{COMPANY.slogan}”</p>
        </div>
      </div>
    </footer>
  );
}

/* ── ortak başlık bloğu ───────────────────────────────────────── */
function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-green">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted">{subtitle}</p>
    </div>
  );
}
