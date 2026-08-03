"use client";

import { useState } from "react";
import { disconnectInstagram } from "@/lib/actions/social";

export function DisconnectButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Instagram bağlantısını kaldırmak istiyor musunuz?")) return;
        setBusy(true);
        try {
          await disconnectInstagram();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-orange/50 hover:text-fg disabled:opacity-50"
    >
      {busy ? "…" : "Bağlantıyı kaldır"}
    </button>
  );
}
