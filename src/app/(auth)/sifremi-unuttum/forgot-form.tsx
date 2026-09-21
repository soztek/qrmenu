"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/form";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green/40 bg-green-soft/40 p-4 text-sm text-fg">
        <p className="font-semibold">Bağlantı gönderildi ✅</p>
        <p className="mt-1 text-muted">
          Bu e-posta kayıtlıysa, şifre sıfırlama bağlantısını gönderdik. Gelen
          kutunuzu (ve spam klasörünü) kontrol edin. Bağlantı 1 saat geçerlidir.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@isletme.com"
        required
      />
      <FormError message={state.error} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}
