import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <Logo className="h-10" />
      <p className="mt-8 text-6xl font-extrabold tracking-tight text-fg">404</p>
      <h1 className="mt-3 text-xl font-semibold text-fg">Sayfa bulunamadı</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Ana sayfadan devam edebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/kayit"
          className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg transition hover:border-green/50"
        >
          7 gün ücretsiz dene
        </Link>
      </div>
    </main>
  );
}
