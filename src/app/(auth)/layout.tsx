import { Logo } from "@/components/logo";

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
        <Logo className="h-10" />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-8">
        {children}
      </main>
    </div>
  );
}
