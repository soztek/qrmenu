"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveReview,
  unapproveReview,
  deleteReview,
} from "@/lib/actions/reviews";

export function ReviewActions({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className={`flex gap-2 text-sm ${pending ? "opacity-50" : ""}`}>
      {approved ? (
        <button
          onClick={() => run(() => unapproveReview(id))}
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1.5 text-muted transition hover:border-orange/50 hover:text-fg"
        >
          Yayından kaldır
        </button>
      ) : (
        <button
          onClick={() => run(() => approveReview(id))}
          disabled={pending}
          className="rounded-lg bg-green px-3 py-1.5 font-semibold text-black transition hover:bg-green-dark"
        >
          Onayla
        </button>
      )}
      <button
        onClick={() => {
          if (confirm("Bu yorum silinsin mi?")) run(() => deleteReview(id));
        }}
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1.5 text-faint transition hover:border-orange/50 hover:text-orange"
      >
        Sil
      </button>
    </div>
  );
}
