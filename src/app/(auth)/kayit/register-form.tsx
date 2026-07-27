"use client";

import { useActionState } from "react";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/form";

export function RegisterForm({ plan }: { plan?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {plan ? <input type="hidden" name="plan" value={plan} /> : null}

      <Field
        label="Ad soyad"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Ahmet Yılmaz"
        required
      />
      <Field
        label="İşletme adı"
        name="businessName"
        type="text"
        placeholder="Köşe Kafe"
        required
      />
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ornek@isletme.com"
        required
      />
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="En az 6 karakter"
        minLength={6}
        required
      />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
      >
        {pending ? "Hesap oluşturuluyor…" : "Ücretsiz hesabı oluştur"}
      </button>
    </form>
  );
}
