"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import type { PlanId } from "@/lib/plans";
import type { SubscriptionStatus } from "@/generated/prisma/enums";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) throw new Error("Yetkisiz");
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
}

/**
 * İşletmenin erişim süresini `days` gün uzatır.
 * - Denemedeyse: trialEndsAt uzatılır (süresi geçmişse bugünden başlar).
 * - Diğer durumlarda: aktif aboneliğe çevrilip currentPeriodEnd uzatılır.
 */
export async function extendAccess(businessId: string, days: number): Promise<void> {
  await assertAdmin();
  if (!Number.isFinite(days) || days === 0) return;

  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true },
  });
  if (!b) return;

  const ms = days * 86_400_000;
  const now = Date.now();

  if (b.subscriptionStatus === "trialing") {
    const base = Math.max(new Date(b.trialEndsAt).getTime(), now);
    await prisma.business.update({
      where: { id: businessId },
      data: { trialEndsAt: new Date(base + ms) },
    });
  } else {
    const base = Math.max(
      b.currentPeriodEnd ? new Date(b.currentPeriodEnd).getTime() : 0,
      now,
    );
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(base + ms),
      },
    });
  }
  refresh();
}

/** İşletmenin paketini değiştirir. */
export async function setPlan(businessId: string, plan: PlanId): Promise<void> {
  await assertAdmin();
  await prisma.business.update({ where: { id: businessId }, data: { plan } });
  refresh();
}

/** Bir işletme sahibinin şifresini sıfırlar (admin müşteriye yeni şifreyi iletir). */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  await assertAdmin();
  if (!userId || newPassword.length < 6) return;
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}

/** İşletmenin abonelik durumunu değiştirir. */
export async function setStatus(
  businessId: string,
  status: SubscriptionStatus,
): Promise<void> {
  await assertAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { subscriptionStatus: status },
  });
  refresh();
}
