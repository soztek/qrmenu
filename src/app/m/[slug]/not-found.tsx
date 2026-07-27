import Link from "next/link";

export default function MenuNotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold">Menü bulunamadı</h1>
        <p className="mt-2 text-muted">
          Bu adrese ait bir menü yok. QR kodu tekrar okutmayı deneyin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
