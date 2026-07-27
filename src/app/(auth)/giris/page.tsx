import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş yap" };

export default async function GirisPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Giriş yap</h1>
        <p className="mt-1.5 text-sm text-muted">
          İşletme panelinize erişmek için giriş yapın.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="font-medium text-green hover:underline">
            Ücretsiz kaydolun
          </Link>
        </p>
      </div>
    </div>
  );
}
