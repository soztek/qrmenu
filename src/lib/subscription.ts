import type { SubscriptionStatus } from "@/generated/prisma/enums";

export interface SubLike {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
}

/** Denemenin bitmesine kalan tam gün sayısı (min 0). */
export function trialDaysLeft(b: { trialEndsAt: Date }): number {
  const ms = new Date(b.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** İşletme panele/özelliklere erişebilir mi? (aktif abonelik ya da süren deneme) */
export function hasActiveAccess(b: SubLike): boolean {
  if (b.subscriptionStatus === "active") {
    return !b.currentPeriodEnd || new Date(b.currentPeriodEnd) > new Date();
  }
  if (b.subscriptionStatus === "trialing") {
    return new Date(b.trialEndsAt) > new Date();
  }
  return false;
}

/** Kullanıcıya gösterilecek durum etiketi. */
export function statusLabel(b: SubLike): string {
  switch (b.subscriptionStatus) {
    case "active":
      return "Aktif abonelik";
    case "trialing": {
      const d = trialDaysLeft(b);
      return d > 0 ? `Deneme — ${d} gün kaldı` : "Deneme süresi doldu";
    }
    case "past_due":
      return "Ödeme bekleniyor";
    case "canceled":
      return "İptal edildi";
  }
}
