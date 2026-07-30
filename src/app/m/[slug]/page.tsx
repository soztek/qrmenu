import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { MenuView } from "./menu-view";
import { VisitTracker } from "@/components/visit-tracker";

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
    select: { name: true },
  });
  return { title: business ? `${business.name} — Menü` : "Menü" };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  return (
    <>
      <VisitTracker kind="menu" />
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
