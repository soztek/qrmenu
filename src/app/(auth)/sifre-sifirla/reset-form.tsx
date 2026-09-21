"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/form";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green/40 bg-green-soft/40 p-4 text-sm text-fg">
        <p className="font-semibold">Şifreniz güncellendi ✅</p>
        <p className="mt-1 text-muted">
          Yeni şifrenizle giriş yapabilirsiniz.
        </p>
        <Link
          href="/giris"
          className="mt-4 inline-block rounded-lg bg-green px-5 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-orange/40 bg-orange/10 p-4 text-sm">
        <p className="font-semibold text-orange">Geçersiz bağlantı</p>
        <p className="mt-1 text-muted">
          Bağlantı eksik veya bozuk. Lütfen yeniden{" "}
          <Link href="/sifremi-unuttum" className="text-green hover:underline">
            sıfırlama talebi
          </Link>{" "}
          oluşturun.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="Yeni şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="En az 6 karakter"
        required
      />
      <FormError message={state.error} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
      >
        {pending ? "Güncelleniyor…" : "Şifreyi güncelle"}
      </button>
    </form>
  );
}
