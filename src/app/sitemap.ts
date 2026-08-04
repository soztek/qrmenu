import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let businesses: { slug: string; updatedAt?: Date }[] = [];
  try {
    businesses = await prisma.business.findMany({ select: { slug: true } });
  } catch {
    businesses = [];
  }

  const staticPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/hakkimizda", priority: 0.5, freq: "monthly" },
    { path: "/gizlilik", priority: 0.3, freq: "yearly" },
    { path: "/mesafeli-satis-sozlesmesi", priority: 0.3, freq: "yearly" },
    { path: "/teslimat-iade", priority: 0.3, freq: "yearly" },
  ];

  return [
    ...staticPaths.map((s) => ({
      url: `${SITE_URL}${s.path}`,
      changeFrequency: s.freq,
      priority: s.priority,
    })),
    ...businesses.map((b) => ({
      url: `${SITE_URL}/m/${b.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
