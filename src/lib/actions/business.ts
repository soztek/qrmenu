"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type BusinessState = { error?: string; ok?: boolean };

// /m/<slug> altında olduğu için üst düzey route'larla çakışmaz, yine de
// karışıklık yaratmasın diye birkaç kelimeyi rezerve ediyoruz.
const RESERVED_SLUGS = new Set(["admin", "api", "dashboard", "giris", "kayit", "m"]);

const schema = z.object({
  slug: z.string().trim().max(50).optional(),
  name: z.string().trim().min(2, "İşletme adı en az 2 karakter olmalı").max(80),
  description: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  mapsUrl: z.string().trim().max(500).optional(),
  instagram: z.string().trim().max(100).optional(),
  wifiName: z.string().trim().max(60).optional(),
  wifiPassword: z.string().trim().max(60).optional(),
  workingHours: z.string().trim().max(120).optional(),
  logoUrl: z.string().trim().optional(),
  coverUrl: z.string().trim().optional(),
  menuTheme: z
    .enum(["dark", "corporate", "luxury", "organic", "warm", "tropical", "berry"])
    .optional(),
});

const emptyToNull = (v?: string) => (v && v.length > 0 ? v : null);

export async function updateBusiness(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await getCurrentUser();
  if (!user?.business) return { error: "Yetkisiz" };

  const parsed = schema.safeParse({
    slug: formData.get("slug") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    mapsUrl: formData.get("mapsUrl") || undefined,
    instagram: formData.get("instagram") || undefined,
    wifiName: formData.get("wifiName") || undefined,
    wifiPassword: formData.get("wifiPassword") || undefined,
    workingHours: formData.get("workingHours") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    menuTheme: formData.get("menuTheme") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }
  const d = parsed.data;

  // Menü adresi (slug) değiştiriliyorsa doğrula + benzersizlik.
  let newSlug: string | undefined;
  if (d.slug) {
    const s = slugify(d.slug);
    if (s.length < 2) {
      return { error: "Menü adresi en az 2 karakter olmalı (harf/rakam)." };
    }
    if (RESERVED_SLUGS.has(s)) {
      return { error: "Bu menü adresi ayrılmış, başka bir ad seç." };
    }
    if (s !== user.business.slug) {
      const taken = await prisma.business.findFirst({
        where: { slug: s, id: { not: user.business.id } },
        select: { id: true },
      });
      if (taken) {
        return { error: "Bu menü adresi kullanılıyor, başka bir ad dene." };
      }
      newSlug = s;
    }
  }

  // Instagram: tam URL değilse @'siz kullanıcı adına indir.
  let instagram = emptyToNull(d.instagram);
  if (instagram) instagram = instagram.replace(/^@/, "").trim();

  await prisma.business.update({
    where: { id: user.business.id },
    data: {
      ...(newSlug ? { slug: newSlug } : {}),
      name: d.name,
      description: emptyToNull(d.description),
      phone: emptyToNull(d.phone),
      address: emptyToNull(d.address),
      mapsUrl: emptyToNull(d.mapsUrl),
      instagram,
      wifiName: emptyToNull(d.wifiName),
      wifiPassword: emptyToNull(d.wifiPassword),
      workingHours: emptyToNull(d.workingHours),
      logoUrl: emptyToNull(d.logoUrl),
      coverUrl: emptyToNull(d.coverUrl),
      ...(d.menuTheme ? { menuTheme: d.menuTheme } : {}),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/m/${user.business.slug}`);
  if (newSlug) revalidatePath(`/m/${newSlug}`);
  return { ok: true };
}
