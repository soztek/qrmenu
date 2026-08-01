import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ödeme başarısız" };

export default function BasarisizPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange/15 text-3xl">
        ⚠️
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
        Ödeme tamamlanamadı
      </h1>
      <p className="mt-2 text-muted">
        Ödeme sırasında bir sorun oluştu ya da işlem iptal edildi. Kartından
        ücret çekilmediyse tekrar deneyebilirsin.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/dashboard/abonelik"
          className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Tekrar dene
        </Link>
      </div>
    </div>
  );
}
