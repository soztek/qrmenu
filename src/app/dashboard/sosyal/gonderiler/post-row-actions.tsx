"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPostStatus, publishNow, deletePost } from "@/lib/actions/social";
import type { SocialPostStatus } from "@/generated/prisma/enums";

export function PostRowActions({
  postId,
  status,
  canPublish,
  hasImage,
}: {
  postId: string;
  status: SocialPostStatus;
  canPublish: boolean;
  hasImage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState<string>("");

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    setErr("");
    try {
      const res = await fn();
      if (!res.ok) setErr(res.error ?? "İşlem başarısız.");
      else router.refresh();
    } finally {
      setBusy("");
    }
  }

  const publishable =
    (status === "approved" || status === "failed" || status === "scheduled") && hasImage;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {(status === "draft" || status === "pending_approval") && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("approve", () => setPostStatus(postId, "approved"))}
            className="rounded-lg border border-border px-2.5 py-1 text-xs text-fg transition hover:border-green/50 disabled:opacity-50"
          >
            {busy === "approve" ? "…" : "✅ Onayla"}
          </button>
        )}

        {publishable && (
          <button
            type="button"
            disabled={!!busy || !canPublish}
            title={canPublish ? undefined : "Önce Instagram'ı bağlayın"}
            onClick={() => run("publish", () => publishNow(postId))}
            className="rounded-lg bg-gradient-to-b from-[#25D366] to-[#1eaf57] px-2.5 py-1 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {busy === "publish" ? "…" : status === "failed" ? "🔁 Tekrar dene" : "📤 Yayınla"}
          </button>
        )}

        {status !== "draft" && status !== "published" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("draft", () => setPostStatus(postId, "draft"))}
            className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:text-fg disabled:opacity-50"
          >
            Taslağa al
          </button>
        )}

        <button
          type="button"
          disabled={!!busy}
          onClick={() => {
            if (confirm("Bu gönderiyi silmek istiyor musunuz?")) run("del", () => deletePost(postId));
          }}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:border-orange/50 hover:text-fg disabled:opacity-50"
        >
          🗑
        </button>
      </div>
      {err && <span className="text-xs text-orange">{err}</span>}
    </div>
  );
}
