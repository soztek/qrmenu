"use client";

import { useActionState, useEffect, useState } from "react";
import { changePasswordAction, type AuthState } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/form";

export function PasswordChange() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    changePasswordAction,
    {},
  );
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (state.ok) {
      setDone(true);
      const t = setTimeout(() => setDone(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-semibold">Şifre değiştir</h2>
      <p className="mt-1 text-sm text-muted">
        Şifreni unutmamak için hatırlayacağın bir şifre belirle.
      </p>
      <form action={action} className="mt-4 max-w-sm space-y-4">
        <Field
          label="Mevcut şifre"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
        <Field
          label="Yeni şifre"
          name="next"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          minLength={6}
          required
        />
        <FormError message={state.error} />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : "Şifreyi değiştir"}
          </button>
          {done && <span className="text-sm text-green">Değiştirildi ✓</span>}
        </div>
      </form>
    </section>
  );
}
