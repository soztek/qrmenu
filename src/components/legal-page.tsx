import Link from "next/link";
import { Logo } from "@/components/logo";

/** Yasal/bilgi sayfaları için ortak sade düzen. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Logo href="/" className="h-8" />
          <Link href="/" className="text-sm text-muted hover:text-fg">
            ← Ana sayfa
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {updated && (
          <p className="mt-1 text-xs text-faint">Son güncelleme: {updated}</p>
        )}
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-fg [&_a]:text-green [&_a]:underline [&_strong]:text-fg">
          {children}
        </div>
      </main>
    </div>
  );
}
