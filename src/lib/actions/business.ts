"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type BusinessState = { error?: string; ok?: boolean };

const schema = z.object({
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
  menuTheme: z.enum(["dark", "corporate", "luxury", "organic"]).optional(),
});

const emptyToNull = (v?: string) => (v && v.length > 0 ? v : null);

export async function updateBusiness(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await getCurrentUser();
  if (!user?.business) return { error: "Yetkisiz" };

  const parsed = schema.safeParse({
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

  // Instagram: tam URL değilse @'siz kullanıcı adına indir.
  let instagram = emptyToNull(d.instagram);
  if (instagram) instagram = instagram.replace(/^@/, "").trim();

  await prisma.business.update({
    where: { id: user.business.id },
    data: {
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
  return { ok: true };
}
