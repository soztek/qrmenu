"use client";

import { useState } from "react";
import { logPrint } from "@/lib/actions/orders";

export function ReceiptPrint({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        logPrint(orderId).catch(() => {});
        setTimeout(() => {
          window.print();
          setBusy(false);
        }, 150);
      }}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
    >
      🖨 Fişi yazdır
    </button>
  );
}
