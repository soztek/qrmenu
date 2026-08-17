import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { hasActiveAccess } from "@/lib/subscription";

/**
 * Erişim kapısı: deneme süresi dolmuş / aboneliği bitmiş işletme buradaki
 * hiçbir sayfayı göremez; ödeme (abonelik) ekranına yönlendirilir.
 * Abonelik sayfaları bu grubun DIŞINDA olduğu için yönlendirme döngüsü oluşmaz.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect(isAdmin(user) ? "/admin" : "/kayit");

  if (!hasActiveAccess(user.business)) {
    redirect("/dashboard/abonelik");
  }

  return <>{children}</>;
}
