"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteUpload } from "@/lib/storage";

export type ActionState = { error?: string; ok?: boolean };

/** Oturumdaki işletmenin id'si; yoksa hata fırlatır. */
async function requireBusinessId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.business) throw new Error("Yetkisiz");
  return user.business.id;
}

function refresh(slug?: string) {
  revalidatePath("/dashboard/menu");
  if (slug) revalidatePath(`/m/${slug}`);
}

/* ── Kategoriler ──────────────────────────────────────────────── */

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = await requireBusinessId();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) return { error: "Kategori adı gerekli" };
  if (name.length > 60) return { error: "Kategori adı çok uzun" };

  const count = await prisma.category.count({ where: { businessId } });
  await prisma.category.create({
    data: { businessId, name, sortOrder: count },
  });
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const businessId = await requireBusinessId();
  const trimmed = name.trim();
  if (!trimmed) return;
  await prisma.category.updateMany({
    where: { id, businessId },
    data: { name: trimmed.slice(0, 60) },
  });
  refresh();
}

export async function setCategoryImage(
  id: string,
  imageUrl: string,
): Promise<void> {
  const businessId = await requireBusinessId();
  await prisma.category.updateMany({
    where: { id, businessId },
    data: { imageUrl: imageUrl || null },
  });
  refresh();
}

export async function deleteCategory(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  // Kategoriye bağlı ürün fotoğraflarını temizle.
  const items = await prisma.menuItem.findMany({
    where: { categoryId: id, businessId },
    select: { photoUrl: true },
  });
  const res = await prisma.category.deleteMany({ where: { id, businessId } });
  if (res.count > 0) {
    await Promise.all(items.map((i) => deleteUpload(i.photoUrl)));
  }
  refresh();
}

/* ── Ürünler ──────────────────────────────────────────────────── */

const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Ürün adı gerekli").max(80),
  description: z.string().trim().max(300).optional(),
  price: z.coerce
    .number({ message: "Geçerli bir fiyat girin" })
    .min(0, "Fiyat negatif olamaz")
    .max(1_000_000),
  photoUrl: z.string().optional(),
});

export async function createItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = await requireBusinessId();
  const parsed = itemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    photoUrl: formData.get("photoUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }
  const { categoryId, name, description, price, photoUrl } = parsed.data;

  // Kategori bu işletmeye mi ait?
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
    select: { id: true },
  });
  if (!category) return { error: "Kategori bulunamadı" };

  const count = await prisma.menuItem.count({ where: { categoryId, businessId } });
  await prisma.menuItem.create({
    data: {
      businessId,
      categoryId,
      name,
      description: description || null,
      price,
      photoUrl: photoUrl || null,
      sortOrder: count,
    },
  });
  refresh();
  return { ok: true };
}

export async function updateItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = await requireBusinessId();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ürün bulunamadı" };

  const parsed = itemSchema.omit({ categoryId: true }).safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    photoUrl: formData.get("photoUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }
  const { name, description, price, photoUrl } = parsed.data;

  const existing = await prisma.menuItem.findFirst({
    where: { id, businessId },
    select: { photoUrl: true },
  });
  if (!existing) return { error: "Ürün bulunamadı" };

  await prisma.menuItem.updateMany({
    where: { id, businessId },
    data: {
      name,
      description: description || null,
      price,
      photoUrl: photoUrl || null,
    },
  });

  // Fotoğraf değiştiyse eskisini sil.
  if (existing.photoUrl && existing.photoUrl !== (photoUrl || null)) {
    await deleteUpload(existing.photoUrl);
  }
  refresh();
  return { ok: true };
}

export async function toggleItemAvailability(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  const item = await prisma.menuItem.findFirst({
    where: { id, businessId },
    select: { isAvailable: true },
  });
  if (!item) return;
  await prisma.menuItem.updateMany({
    where: { id, businessId },
    data: { isAvailable: !item.isAvailable },
  });
  refresh();
}

export async function deleteItem(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  const item = await prisma.menuItem.findFirst({
    where: { id, businessId },
    select: { photoUrl: true },
  });
  const res = await prisma.menuItem.deleteMany({ where: { id, businessId } });
  if (res.count > 0) await deleteUpload(item?.photoUrl);
  refresh();
}
