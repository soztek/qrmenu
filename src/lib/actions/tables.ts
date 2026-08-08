"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireOrderingBusiness } from "@/lib/orders/guard";

export type TableResult = { ok: true } | { ok: false; error: string };

/** Masa ekle. */
export async function createTable(label: string): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const clean = label.trim().slice(0, 40);
  if (!clean) return { ok: false, error: "Masa adı gerekli." };
  const count = await prisma.restaurantTable.count({ where: { businessId: business.id } });
  if (count >= 200) return { ok: false, error: "Masa limitine ulaşıldı." };
  await prisma.restaurantTable.create({
    data: { businessId: business.id, label: clean },
  });
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}

/** Birden çok masayı hızlı ekle (ör. "1..10"). */
export async function createTablesBulk(
  prefix: string,
  count: number,
): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const n = Math.max(1, Math.min(50, Math.floor(count || 0)));
  const p = prefix.trim().slice(0, 20) || "Masa";
  const existing = await prisma.restaurantTable.count({ where: { businessId: business.id } });
  if (existing + n > 200) return { ok: false, error: "Masa limiti (200) aşılıyor." };
  await prisma.restaurantTable.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      businessId: business.id,
      label: `${p} ${i + 1}`,
    })),
  });
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}

/** Masa adını değiştir. */
export async function renameTable(id: string, label: string): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const clean = label.trim().slice(0, 40);
  if (!clean) return { ok: false, error: "Masa adı gerekli." };
  const res = await prisma.restaurantTable.updateMany({
    where: { id, businessId: business.id },
    data: { label: clean },
  });
  if (res.count === 0) return { ok: false, error: "Masa bulunamadı." };
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}

/** Masayı sil (geçmiş siparişler korunur — Order.tableId SetNull). */
export async function deleteTable(id: string): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const res = await prisma.restaurantTable.deleteMany({
    where: { id, businessId: business.id },
  });
  if (res.count === 0) return { ok: false, error: "Masa bulunamadı." };
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}

/** QR token'ı yenile (eski QR geçersiz olur). */
export async function regenerateTableToken(id: string): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const table = await prisma.restaurantTable.findFirst({
    where: { id, businessId: business.id },
    select: { id: true },
  });
  if (!table) return { ok: false, error: "Masa bulunamadı." };
  const token = randomBytes(18).toString("base64url");
  await prisma.restaurantTable.update({
    where: { id: table.id },
    data: { qrToken: token, active: true },
  });
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}

/** Masa QR'ını aktif/pasif yap. */
export async function setTableActive(id: string, active: boolean): Promise<TableResult> {
  const { business } = await requireOrderingBusiness();
  const res = await prisma.restaurantTable.updateMany({
    where: { id, businessId: business.id },
    data: { active },
  });
  if (res.count === 0) return { ok: false, error: "Masa bulunamadı." };
  revalidatePath("/dashboard/masalar");
  return { ok: true };
}
