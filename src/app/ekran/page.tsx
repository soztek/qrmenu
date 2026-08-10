import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ScreenVideo } from "./screen-video";

export const metadata: Metadata = { title: "Dijital ekran menüsü" };
export const dynamic = "force-dynamic";

export default async function ScreenMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  // Admin ?b=<işletmeId> ile herhangi bir işletmenin ekran videosunu üretebilir.
  const { b } = await searchParams;
  const viewingOther = Boolean(b) && isAdmin(user);
  let business;
  if (viewingOther) {
    business = await prisma.business.findUnique({ where: { id: b } });
    if (!business) notFound();
  } else {
    if (!user.business) redirect("/dashboard");
    business = user.business;
  }

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, price: true, photoUrl: true },
      },
    },
  });

  const data = categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({
        name: i.name,
        price: i.price.toString(),
        photoUrl: i.photoUrl,
      })),
    }));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Dijital ekran menüsü
            </h1>
            <p className="mt-1 text-muted">
              {business.name} · 1920×1080 döngü video — TV / dijital ekranda
              yayınlayın.
            </p>
            {viewingOther && (
              <p className="mt-1 text-xs text-orange">
                Admin görünümü: bu işletme için video üretiyorsunuz.
              </p>
            )}
          </div>
          <Link
            href={viewingOther ? "/admin/businesses" : "/dashboard/menu"}
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            ← Geri
          </Link>
        </div>

        <ScreenVideo
          businessName={business.name}
          slug={business.slug}
          categories={data}
        />
      </div>
    </div>
  );
}
