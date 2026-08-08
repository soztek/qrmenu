import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { planHasFeature } from "@/lib/plans";

/**
 * Sipariş özelliği guard'ı: giriş + işletme + Pro/Premium (orders) kilidi.
 * Yetkisizse uygun yere yönlendirir.
 */
export async function requireOrderingBusiness() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect("/kayit");
  if (!planHasFeature(user.business.plan, "orders")) {
    redirect("/dashboard/abonelik");
  }
  return { user, business: user.business };
}
