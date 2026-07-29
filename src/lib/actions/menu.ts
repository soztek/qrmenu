"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteUpload } from "@/lib/storage";
import { isAllergenKey, isMeatKey } from "@/lib/compliance";

export type ActionState = { error?: string; ok?: boolean; created?: number };

/** "120", "₺120,50", "120 TL" → 120.5 / null. */
function parsePrice(s: string): number | null {
  const cleaned = s
    .replace(/₺/g, "")
    .replace(/tl/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : null;
}

/** Bir satırı ürüne çevirir. Biçim: "Ad | açıklama | fiyat" / "Ad | fiyat" / "Ad 120". */
function parseItemLine(
  line: string,
): { name: string; description: string | null; price: number } | null {
  const cells = line.split(/[|\t;]/).map((s) => s.trim());
  while (cells.length && cells[cells.length - 1] === "") cells.pop();

  if (cells.length >= 2) {
    const price = parsePrice(cells[cells.length - 1]);
    const name = cells[0];
    if (price === null || !name) return null;
    const description =
      cells.length >= 3 ? cells.slice(1, -1).join(" ").trim() || null : null;
    return {
      name: name.slice(0, 80),
      description: description ? description.slice(0, 300) : null,
      price,
    };
  }

  // Tek hücre: "Ürün adı 120" / "Ürün adı - 120"
  const m = line.match(/^(.*?)[\s\-–—:]+([\d.,]+)\s*(?:₺|tl)?$/i);
  if (m) {
    const price = parsePrice(m[2]);
    const name = m[1].trim();
    if (price !== null && name) {
      return { name: name.slice(0, 80), description: null, price };
    }
  }
  return null;
}

/** Yapıştırılan listeden bir kategoriye toplu ürün ekler. */
export async function bulkCreateItems(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = await requireBusinessId();
  const categoryId = String(formData.get("categoryId") ?? "");
  const text = String(formData.get("text") ?? "");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
    select: { id: true },
  });
  if (!category) return { error: "Kategori bulunamadı" };

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200);

  const parsed = lines
    .map(parseItemLine)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (parsed.length === 0) {
    return {
      error: "Geçerli satır bulunamadı. Biçim: Ürün adı | açıklama | fiyat",
    };
  }

  const count = await prisma.menuItem.count({ where: { categoryId, businessId } });
  await prisma.menuItem.createMany({
    data: parsed.map((p, i) => ({
      businessId,
      categoryId,
      name: p.name,
      description: p.description,
      price: p.price,
      sortOrder: count + i,
    })),
  });
  refresh();
  return { ok: true, created: parsed.length };
}

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

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Yasal uyumluluk alanlarını FormData'dan çıkarır (hepsi opsiyonel). */
function parseCompliance(formData: FormData) {
  const cal = numOrNull(formData.get("calories"));
  const meatRaw = String(formData.get("meatType") ?? "");
  const isOn = (v: FormDataEntryValue | null) => v === "on" || v === "true";
  return {
    calories: cal === null ? null : Math.round(cal),
    protein: numOrNull(formData.get("protein")),
    fat: numOrNull(formData.get("fat")),
    carbs: numOrNull(formData.get("carbs")),
    allergens: formData.getAll("allergens").map(String).filter(isAllergenKey),
    meatType: isMeatKey(meatRaw) ? meatRaw : null,
    containsAlcohol: isOn(formData.get("containsAlcohol")),
    containsPork: isOn(formData.get("containsPork")),
  };
}

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
      ...parseCompliance(formData),
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
      ...parseCompliance(formData),
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
