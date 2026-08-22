import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { MenuView } from "./menu-view";
import { OrderView } from "./order-view";
import { loadOrderContext } from "@/lib/orders/menu";
import { VisitTracker } from "@/components/visit-tracker";
import { abs } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getMenu(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      menuTheme: true,
      phone: true,
      whatsapp: true,
      address: true,
      mapsUrl: true,
      instagram: true,
      wifiName: true,
      wifiPassword: true,
      workingHours: true,
      categories: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          items: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              photoUrl: true,
              calories: true,
              protein: true,
              fat: true,
              carbs: true,
              allergens: true,
              meatType: true,
              containsAlcohol: true,
              containsPork: true,
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, authorName: true, rating: true, comment: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, description: true, logoUrl: true, coverUrl: true },
  });
  if (!business) return { title: "Menü" };
  const desc =
    business.description ||
    `${business.name} dijital menüsü — kategoriler, ürünler ve güncel fiyatlar. Söztek QR Menü ile hazırlanmıştır.`;
  const img = business.coverUrl || business.logoUrl || undefined;
  const path = `/m/${slug}`;
  // Müşteri menüsünde başlık YALNIZCA işletme adı (kök şablondaki "· Söztek QR Menü" eki eklenmez).
  const title = business.name;
  return {
    title: { absolute: title },
    description: desc.slice(0, 160),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: abs(path),
      title,
      description: desc.slice(0, 160),
      siteName: business.name,
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 160),
      images: img ? [img] : undefined,
    },
  };
}

/** Admin QR'ı durdurduğunda müşteriye gösterilen bakım ekranı. */
function PausedScreen({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="mx-auto h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-soft text-2xl">
            🍽️
          </div>
        )}
        <h1 className="mt-5 text-lg font-bold text-fg">{name}</h1>
        <div className="mt-4 text-4xl">🛠️</div>
        <h2 className="mt-3 text-xl font-extrabold text-fg">
          Güncellemelerimiz devam ediyor
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Menümüz kısa süreliğine güncelleniyor. Lütfen siparişinizi
          personelimize <b>manuel</b> olarak iletiniz. Anlayışınız için teşekkür ederiz.
        </p>
        <p className="mt-6 text-xs text-faint">Söztek QR Menü</p>
      </div>
    </main>
  );
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;

  // Admin QR'ı durdurmuşsa: menü/sipariş yerine bakım ekranı göster.
  const gate = await prisma.business.findUnique({
    where: { slug },
    select: { menuPaused: true, name: true, logoUrl: true },
  });
  if (!gate) notFound();
  if (gate.menuPaused) {
    return <PausedScreen name={gate.name} logoUrl={gate.logoUrl} />;
  }

  // Masa QR token'ı geçerli + sipariş açıksa → sipariş görünümü
  if (t) {
    const ctx = await loadOrderContext(slug, t);
    if (ctx) {
      return (
        <>
          <VisitTracker kind="menu" slug={slug} />
          <OrderView ctx={ctx} />
        </>
      );
    }
  }

  const business = await getMenu(slug);
  if (!business) notFound();

  // Sadece ürünü olan kategoriler; Decimal -> string.
  const categories = business.categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price.toString(),
        photoUrl: i.photoUrl,
        calories: i.calories,
        allergens: i.allergens,
        meatType: i.meatType,
        containsAlcohol: i.containsAlcohol,
        containsPork: i.containsPork,
        protein: i.protein?.toString() ?? null,
        fat: i.fat?.toString() ?? null,
        carbs: i.carbs?.toString() ?? null,
      })),
    }));

  const ratings = business.reviews.map((r) => r.rating).filter((n) => typeof n === "number");
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const menuJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: business.name,
    url: abs(`/m/${business.slug}`),
    ...(business.description ? { description: business.description } : {}),
    ...(business.coverUrl || business.logoUrl ? { image: business.coverUrl || business.logoUrl } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.address ? { address: { "@type": "PostalAddress", streetAddress: business.address, addressCountry: "TR" } } : {}),
    ...(ratings.length
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: ratings.length } }
      : {}),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: categories.map((c) => ({
        "@type": "MenuSection",
        name: c.name,
        hasMenuItem: c.items.map((i) => ({
          "@type": "MenuItem",
          name: i.name,
          ...(i.description ? { description: i.description } : {}),
          offers: { "@type": "Offer", price: i.price, priceCurrency: "TRY" },
        })),
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }} />
      <VisitTracker kind="menu" slug={business.slug} />
      <MenuView
      business={{
        name: business.name,
        slug: business.slug,
        description: business.description,
        logoUrl: business.logoUrl,
        coverUrl: business.coverUrl,
        phone: business.phone,
        whatsapp: business.whatsapp,
        address: business.address,
        mapsUrl: business.mapsUrl,
        instagram: business.instagram,
        wifiName: business.wifiName,
        wifiPassword: business.wifiPassword,
        workingHours: business.workingHours,
      }}
      categories={categories}
      reviews={business.reviews}
      theme={business.menuTheme}
      />
    </>
  );
}
