import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px 300px at 50% -5%, rgba(34,197,94,.14), transparent 60%), radial-gradient(500px 300px at 80% 10%, rgba(249,115,22,.10), transparent 60%)",
        }}
      />
      <header className="p-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-green to-orange text-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
              <path d="M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z" />
            </svg>
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            Söztek<span className="text-green"> QR</span> Menü
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-8">
        {children}
      </main>
    </div>
  );
}
