import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/lib/actions/auth";

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
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange to-green text-black">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  <path d="M12 3l7 4v5c0 4-3 7-7 8-4-1-7-4-7-8V7z" />
                </svg>
              </span>
              <span className="text-sm font-bold tracking-tight">
                Söztek <span className="text-orange">Admin</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
              <Link href="/admin" className="transition hover:text-fg">Genel bakış</Link>
              <Link href="/admin/businesses" className="transition hover:text-fg">İşletmeler</Link>
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
        <div className="flex gap-4 border-t border-border px-5 py-2 text-sm text-muted sm:hidden">
          <Link href="/admin" className="transition hover:text-fg">Genel bakış</Link>
          <Link href="/admin/businesses" className="transition hover:text-fg">İşletmeler</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
