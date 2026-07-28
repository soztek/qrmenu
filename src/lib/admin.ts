import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** ADMIN_EMAILS env'inden (virgülle ayrılmış) admin e-postaları. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.toLowerCase());
}

/** Kullanıcı platform admini mi? (rol=admin ya da e-postası ADMIN_EMAILS'te) */
export function isAdmin(user: { role: string; email: string }): boolean {
  return user.role === "admin" || isAdminEmail(user.email);
}

/** Admin sayfaları için guard: admin değilse yönlendirir, adminse kullanıcıyı döner. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}
