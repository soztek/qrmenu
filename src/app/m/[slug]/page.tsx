import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatTL } from "@/lib/url";

export const dynamic = "force-dynamic";

async function getMenu(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      logoUrl: true,
      categories: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          items: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              photoUrl: true,
            },
          },
        },
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
    select: { name: true },
  });
  return {
    title: business ? `${business.name} — Menü` : "Menü",
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getMenu(slug);
  if (!business) notFound();

  // Sadece ürünü olan kategoriler.
  const categories = business.categories.filter((c) => c.items.length > 0);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-bg">
      {/* Başlık */}
      <header className="bg-gradient-to-br from-green-soft to-orange-soft px-5 pb-6 pt-8">
        {business.logoUrl && (
          <Image
            src={business.logoUrl}
            alt={business.name}
            width={56}
            height={56}
            className="mb-3 h-14 w-14 rounded-xl object-cover"
          />
        )}
        <h1 className="text-2xl font-extrabold tracking-tight">{business.name}</h1>
        {business.description && (
          <p className="mt-1.5 text-sm text-muted">{business.description}</p>
        )}
      </header>

      {categories.length === 0 ? (
        <div className="px-5 py-20 text-center text-muted">
          Menü yakında burada olacak.
        </div>
      ) : (
        <>
          {/* Kategori sekmeleri */}
          <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-border bg-bg/90 px-5 py-3 backdrop-blur">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#kat-${c.id}`}
                className="shrink-0 rounded-full bg-surface-2 px-3.5 py-1.5 text-sm text-muted transition hover:bg-green hover:text-black"
              >
                {c.name}
              </a>
            ))}
          </nav>

          {/* Kategori bölümleri */}
          <div className="space-y-8 px-5 py-6">
            {categories.map((c) => (
              <section key={c.id} id={`kat-${c.id}`} className="scroll-mt-16">
                <h2 className="mb-3 text-lg font-bold text-green">{c.name}</h2>
                <div className="space-y-3">
                  {c.items.map((item) => (
                    <article
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-border bg-surface p-3"
                    >
                      {item.photoUrl ? (
                        <Image
                          src={item.photoUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <span className="shrink-0 font-bold text-orange">
                            {formatTL(item.price.toString())}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-faint">
        <a href="/" className="hover:text-fg">
          Söztek QR Menü ile hazırlandı
        </a>
      </footer>
    </div>
  );
}
