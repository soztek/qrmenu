import { prisma } from "@/lib/db";

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

/** Türkçe karakterleri sadeleştirerek URL-dostu slug üretir. */
export function slugify(input: string): string {
  const normalized = input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
  return normalized
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Business.slug için benzersiz slug üretir (çakışmada -2, -3 ekler). */
export async function uniqueBusinessSlug(name: string): Promise<string> {
  const base = slugify(name) || "isletme";
  let slug = base;
  let n = 1;
  // Çakışma oldukça sonuna sayı ekle.
  while (await prisma.business.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
