import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo href={null} className="h-8" />
              <span className="rounded bg-orange px-1.5 py-0.5 text-[10px] font-bold text-black">
                ADMIN
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
              <Link href="/admin" className="transition hover:text-fg">Genel bakış</Link>
              <Link href="/admin/businesses" className="transition hover:text-fg">İşletmeler</Link>
              <Link href="/admin/ai-video" className="transition hover:text-fg">AI Reklam Stüdyosu</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-faint md:block">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-muted transition hover:border-orange/50 hover:text-fg"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
        {/* mobil nav */}
        <div className="flex gap-4 overflow-x-auto border-t border-border px-5 py-2 text-sm text-muted sm:hidden">
          <Link href="/admin" className="whitespace-nowrap transition hover:text-fg">Genel bakış</Link>
          <Link href="/admin/businesses" className="whitespace-nowrap transition hover:text-fg">İşletmeler</Link>
          <Link href="/admin/ai-video" className="whitespace-nowrap transition hover:text-fg">AI Reklam Stüdyosu</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
