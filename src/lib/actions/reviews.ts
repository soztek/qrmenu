"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ReviewState = { error?: string; ok?: boolean };

const submitSchema = z.object({
  slug: z.string().min(1),
  authorName: z.string().trim().min(2, "Adınızı girin").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Yorum çok kısa").max(500),
});

/** Müşteri yorumu gönderir — onaya düşer (isApproved=false). */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = submitSchema.safeParse({
    slug: formData.get("slug"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgiler" };
  }
  const { slug, authorName, rating, comment } = parsed.data;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!business) return { error: "İşletme bulunamadı" };

  await prisma.review.create({
    data: { businessId: business.id, authorName, rating, comment },
  });
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}

/* ── İşletme moderasyonu ──────────────────────────────────────── */

async function requireBusinessId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.business) throw new Error("Yetkisiz");
  return user.business.id;
}

export async function approveReview(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  await prisma.review.updateMany({
    where: { id, businessId },
    data: { isApproved: true },
  });
  revalidatePath("/dashboard/reviews");
}

export async function unapproveReview(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  await prisma.review.updateMany({
    where: { id, businessId },
    data: { isApproved: false },
  });
  revalidatePath("/dashboard/reviews");
}

export async function deleteReview(id: string): Promise<void> {
  const businessId = await requireBusinessId();
  await prisma.review.deleteMany({ where: { id, businessId } });
  revalidatePath("/dashboard/reviews");
}
