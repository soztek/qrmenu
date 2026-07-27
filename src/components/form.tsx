import type { InputHTMLAttributes } from "react";

/** Etiketli metin girişi — auth ve panel formlarında ortak. */
export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20"
      />
    </label>
  );
}

/** Form hata satırı. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-orange/40 bg-orange-soft px-3.5 py-2.5 text-sm text-orange">
      {message}
    </p>
  );
}
