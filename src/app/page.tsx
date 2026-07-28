import Link from "next/link";
import { PLANS, TRIAL_DAYS, formatPrice } from "@/lib/plans";
import { COMPANY } from "@/lib/company";
import { Logo } from "@/components/logo";

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

/* ── sayfa ────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <PhotoMarquee />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* ── nav ──────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#ozellikler" className="transition hover:text-fg">Özellikler</a>
          <a href="#nasil" className="transition hover:text-fg">Nasıl çalışır</a>
          <a href="#paketler" className="transition hover:text-fg">Paketler</a>
          <a href="#iletisim" className="transition hover:text-fg">İletişim</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/giris"
            className="hidden text-sm text-muted transition hover:text-fg sm:block"
          >
            Giriş yap
          </Link>
          <Link
            href="/kayit"
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Ücretsiz dene
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── hero ─────────────────────────────────────────────────────── */
function Hero() {
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
            {TRIAL_DAYS} gün ücretsiz — kart gerekmez
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            İşletmeniz için{" "}
            <span className="brand-gradient-text">dijital QR menü</span> dakikalar
            içinde
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Menünüzü oluşturun, ürünlerinize fotoğraf ekleyin, QR kodunuzu masaya
            koyun. Müşteriniz telefonundan menüyü görsün, dilerseniz sipariş
            versin.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/kayit"
              className="rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
            >
              Hemen ücretsiz başla
            </Link>
            <a
              href="#nasil"
              className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg transition hover:border-green/50"
            >
              Nasıl çalışır?
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.check} className="h-4 w-4 text-green" /> Kurulum
              gerekmez
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.check} className="h-4 w-4 text-green" /> Anında
              güncelleme
            </span>
          </div>
        </div>

        <PhoneMock />
      </div>
    </section>
  );
}

/* Telefon içinde örnek menü önizlemesi */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="brand-glow rounded-[2.2rem] border border-border bg-surface p-3">
        <div className="overflow-hidden rounded-[1.7rem] bg-bg">
          <div className="bg-gradient-to-br from-green-soft to-orange-soft px-5 pb-5 pt-6">
            <div className="text-xs text-green">Söztek Cafe</div>
            <div className="text-lg font-bold">Menü</div>
            <div className="mt-3 flex gap-2 text-[11px]">
              <span className="rounded-full bg-green px-2.5 py-1 font-medium text-black">
                Popüler
              </span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">
                Tatlılar
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {[
              ["Cheeseburger", "₺180", "/landing/food-burger.png", "Ana yemek"],
              ["Türk Kahvesi", "₺40", "/landing/food-coffee.png", "Sıcak içecek"],
              ["Frambuazlı Pasta", "₺120", "/landing/food-cake.png", "Tatlı"],
            ].map(([name, price, img, tag]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-[11px] text-faint">{tag}</div>
                </div>
                <div className="text-sm font-semibold text-orange">{price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── animasyonlu fotoğraf şeridi ──────────────────────────────── */
function PhotoMarquee() {
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
          İştah açan menüler
        </span>
        <p className="mt-1 text-muted">
          Fotoğraflı ürünlerle müşterinizin iştahını kabartın
        </p>
      </div>
      {/* İki kopya yan yana → kesintisiz kayan bant */}
      <div className="marquee-track flex w-max gap-4">
        {[...photos, ...photos].map((n, i) => (
          <div
            key={i}
            className="h-40 w-60 shrink-0 overflow-hidden rounded-2xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/landing/${n}`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── özellikler ───────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ICONS.qr,
    title: "QR menü",
    desc: "Kendi QR kodunuzu üretin, masaya koyun; müşteri telefonundan menüyü açsın.",
  },
  {
    icon: ICONS.photo,
    title: "Fotoğraflı ürünler",
    desc: "Her ürüne fotoğraf ekleyin; iştah açan görsellerle satışı artırın.",
  },
  {
    icon: ICONS.orders,
    title: "Sipariş + mutfak paneli",
    desc: "Müşteri QR'dan sipariş versin, siparişler canlı mutfak panelinize düşsün.",
  },
  {
    icon: ICONS.tables,
    title: "Masa yönetimi",
    desc: "Her masaya özel QR; hangi siparişin hangi masadan geldiğini görün.",
  },
  {
    icon: ICONS.globe,
    title: "Çoklu dil",
    desc: "Menünüzü birden fazla dilde sunun, yabancı misafirlerinizi rahat ettirin.",
  },
  {
    icon: ICONS.bolt,
    title: "Anında güncelleme",
    desc: "Fiyat mı değişti, ürün mü tükendi? Menü anında güncellenir, baskı yok.",
  },
];

function Features() {
  return (
    <section id="ozellikler" className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow="Özellikler"
          title="İşletmenizin ihtiyacı olan her şey"
          subtitle="Sade bir QR menüden tam kapsamlı sipariş yönetimine kadar, ihtiyacınız kadarını kullanın."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-green/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-soft text-green transition group-hover:bg-green group-hover:text-black">
                <Icon path={f.icon} className="h-5 w-5" />
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
const STEPS = [
  {
    n: "1",
    title: "Kayıt olun",
    desc: `Ücretsiz hesap açın, ${TRIAL_DAYS} günlük denemeniz hemen başlasın.`,
  },
  {
    n: "2",
    title: "Menünüzü oluşturun",
    desc: "Kategori ve ürünlerinizi ekleyin, fotoğraflarını yükleyin.",
  },
  {
    n: "3",
    title: "QR'ı yayınlayın",
    desc: "QR kodunuzu indirin, masaya koyun. Müşteriniz okutsun, menü açılsın.",
  },
];

function HowItWorks() {
  return (
    <section id="nasil" className="border-t border-border/60 bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow="Nasıl çalışır"
          title="3 adımda yayında"
          subtitle="Teknik bilgi gerekmez. Kaydolun, menünüzü girin, QR'ı paylaşın."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-green to-orange font-bold text-black">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
              {i < STEPS.length - 1 && (
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

/* ── fiyatlandırma ────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="paketler" className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow="Paketler"
          title="İşletmenize uygun paketi seçin"
          subtitle={`Tüm paketler ${TRIAL_DAYS} gün ücretsiz. Dilediğiniz zaman iptal edin.`}
        />
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
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
                  En popüler
                </span>
              )}
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">
                  {formatPrice(plan.priceMonthly)}
                </span>
                <span className="text-sm text-faint">/ay</span>
              </div>
              <Link
                href={`/kayit?plan=${plan.id}`}
                className={`mt-6 rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                  plan.popular
                    ? "bg-green text-black hover:bg-green-dark"
                    : "border border-border text-fg hover:border-green/50"
                }`}
              >
                {TRIAL_DAYS} gün ücretsiz dene
              </Link>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.highlights.map((h) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── son CTA ──────────────────────────────────────────────────── */
function FinalCta() {
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
            Menünüzü bugün dijitale taşıyın
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            {TRIAL_DAYS} gün boyunca tüm özellikleri ücretsiz deneyin. Kart bilgisi
            istemiyoruz.
          </p>
          <Link
            href="/kayit"
            className="mt-8 inline-block rounded-lg bg-green px-8 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Ücretsiz hesap oluştur
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── footer ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer id="iletisim" className="border-t border-border/60 pt-14 pb-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marka */}
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">
              İşletmeniz için dijital QR menü, sipariş ve masa yönetimi. Dakikalar
              içinde kurun.
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <Link href="/giris" className="text-muted transition hover:text-fg">Giriş</Link>
              <Link href="/kayit" className="text-muted transition hover:text-fg">Kayıt ol</Link>
              <a href="#paketler" className="text-muted transition hover:text-fg">Paketler</a>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-fg">İletişim</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href={`tel:${COMPANY.phoneRaw}`} className="transition hover:text-green">
                  Tel/Faks: {COMPANY.phone}
                </a>
              </li>
              <li>
                <a href={`tel:${COMPANY.gsmRaw}`} className="transition hover:text-green">
                  GSM: {COMPANY.gsm}
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
            <h3 className="text-sm font-semibold text-fg">Firma</h3>
            <div className="mt-3 space-y-1.5 text-sm text-muted">
              <p className="font-medium text-fg/90">{COMPANY.legalName}</p>
              <p>{COMPANY.address}</p>
              <p>
                Vergi Dairesi: {COMPANY.taxOffice} · VKN: {COMPANY.taxNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-faint md:flex-row">
          <p>
            © {new Date().getFullYear()} {COMPANY.shortName}. Tüm hakları saklıdır.
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
