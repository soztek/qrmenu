import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScreenVideo } from "./screen-video";

export const metadata: Metadata = { title: "Dijital ekran menüsü" };

export default async function EkranPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;
  const business = user.business;

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, price: true },
      },
    },
  });

  const data = categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({ name: i.name, price: i.price.toString() })),
    }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Dijital ekran menüsü
          </h1>
          <p className="mt-1 text-muted">
            Menünüzü 1920×1080 döngü video olarak indirin, TV / dijital ekranda
            yayınlayın.
          </p>
        </div>
        <Link
          href="/dashboard/menu"
          className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
        >
          ← Menü
        </Link>
      </div>

      <ScreenVideo
        businessName={business.name}
        slug={business.slug}
        categories={data}
      />
    </div>
  );
}
