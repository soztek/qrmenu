import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AddCategoryForm,
  CategoryCard,
  type ClientCategory,
} from "./menu-client";
import { ImportMenu } from "./import-menu";
import { CategoryPdfSelect } from "./category-pdf";
import { businessMenuUrl } from "@/lib/url";

export const metadata: Metadata = { title: "Menü" };

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;
  const business = user.business;

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const data: ClientCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price.toString(),
      photoUrl: i.photoUrl,
      isAvailable: i.isAvailable,
      calories: i.calories,
      protein: i.protein?.toString() ?? null,
      fat: i.fat?.toString() ?? null,
      carbs: i.carbs?.toString() ?? null,
      allergens: i.allergens,
      meatType: i.meatType,
      containsAlcohol: i.containsAlcohol,
      containsPork: i.containsPork,
    })),
  }));

  const totalItems = data.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Menü</h1>
          <p className="mt-1 text-muted">
            {data.length} kategori · {totalItems} ürün
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={businessMenuUrl(business)}
            target="_blank"
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            Menüyü önizle ↗
          </Link>
          <Link
            href="/yazdir"
            target="_blank"
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            Yazdırılabilir PDF
          </Link>
          <CategoryPdfSelect
            categories={data.map((c) => ({ id: c.id, name: c.name }))}
          />
          <Link
            href="/ekran"
            target="_blank"
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            Dijital ekran videosu
          </Link>
          <Link
            href="/dashboard/qr"
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            QR kodu
          </Link>
        </div>
      </div>

      {/* Excel / CSV içe aktar */}
      <div className="mt-6">
        <ImportMenu />
      </div>

      {/* Kategori ekle */}
      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <AddCategoryForm />
      </div>

      {/* Kategoriler */}
      <div className="mt-5 space-y-5">
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
            Henüz kategori yok. Yukarıdan ilk kategorini ekleyerek başla.
          </div>
        ) : (
          data.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              isFirst={i === 0}
              isLast={i === data.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
