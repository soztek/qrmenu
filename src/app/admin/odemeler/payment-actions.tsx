"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePayment } from "@/lib/actions/admin";

export function DeletePaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Bu ödeme kaydı silinsin mi?")) return;
        setBusy(true);
        try {
          await deletePayment(id);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded border border-border px-2.5 py-1 text-xs text-muted transition hover:border-orange/50 hover:text-fg disabled:opacity-50"
    >
      {busy ? "…" : "Sil"}
    </button>
  );
}
