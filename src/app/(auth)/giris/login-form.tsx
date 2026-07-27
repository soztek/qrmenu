"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/form";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

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
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Şifreniz"
        required
      />

      <FormError message={state.error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
