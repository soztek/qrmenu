import Link from "next/link";
import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Şifremi unuttum" };

export default function SifremiUnuttumPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Şifremi unuttum</h1>
        <p className="mt-1.5 text-sm text-muted">
          Kayıtlı e-posta adresinizi girin; şifre sıfırlama bağlantısını gönderelim.
        </p>

        <div className="mt-6">
          <ForgotForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/giris" className="font-medium text-green hover:underline">
            ← Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
