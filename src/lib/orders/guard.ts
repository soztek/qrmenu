import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { planHasFeature } from "@/lib/plans";
import { hasActiveAccess } from "@/lib/subscription";

/**
 * Sipariş özelliği guard'ı: giriş + işletme + **aktif Pro/Premium abonelik**.
 * (Planı Pro/Premium olsa da aboneliği bitmişse erişemez.)
 */
export async function requireOrderingBusiness() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect("/kayit");
  const b = user.business;
  if (!planHasFeature(b.plan, "orders") || !hasActiveAccess(b)) {
    redirect("/dashboard/abonelik");
  }
  return { user, business: b };
}
