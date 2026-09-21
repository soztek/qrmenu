import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Şifre sıfırla" };

export default async function SifreSifirlaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Yeni şifre belirle</h1>
        <p className="mt-1.5 text-sm text-muted">
          Hesabınız için yeni bir şifre oluşturun.
        </p>

        <div className="mt-6">
          <ResetForm token={token ?? ""} />
        </div>
      </div>
    </div>
  );
}
