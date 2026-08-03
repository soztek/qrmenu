import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Çok-kiracılı guard: oturumdaki kullanıcının işletmesini döner.
 * İşletme yoksa uygun yere yönlendirir. Tüm sosyal medya sayfaları/aksiyonları
 * bu işletmeye göre izole çalışır (bir restoran sadece kendi verisini görür).
 */
export async function requireBusiness() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect("/kayit");
  return { user, business: user.business };
}
