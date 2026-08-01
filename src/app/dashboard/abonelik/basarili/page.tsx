import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ödeme alındı" };

export default function BasariliPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green/15 text-3xl">
        ✅
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
        Ödeme alındı
      </h1>
      <p className="mt-2 text-muted">
        Teşekkürler! Ödemen onaylandığında aboneliğin otomatik güncellenir
        (genellikle birkaç saniye). Sayfayı yenileyerek durumu görebilirsin.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/dashboard/abonelik"
          className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Aboneliğe dön
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-fg transition hover:border-green/50"
        >
          Panele git
        </Link>
      </div>
    </div>
  );
}
