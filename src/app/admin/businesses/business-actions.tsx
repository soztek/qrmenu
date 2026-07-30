"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  extendAccess,
  setPlan,
  setStatus,
  resetUserPassword,
  deleteBusiness,
} from "@/lib/actions/admin";
import { PLANS, type PlanId } from "@/lib/plans";

const STATUSES: { value: string; label: string }[] = [
  { value: "trialing", label: "Denemede" },
  { value: "active", label: "Aktif" },
  { value: "past_due", label: "Ödeme bekliyor" },
  { value: "canceled", label: "İptal" },
];

const selectCls =
  "rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-fg outline-none focus:border-green";

export function BusinessActions({
  businessId,
  businessName,
  plan,
  status,
  ownerId,
}: {
  businessId: string;
  businessName: string;
  plan: PlanId;
  status: string;
  ownerId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Aksiyonu çalıştır ve ardından tabloyu tazele (revalidatePath + client refresh).
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${pending ? "opacity-50" : ""}`}>
      {/* Süre uzat */}
      <span className="text-[11px] text-faint">Uzat:</span>
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => run(() => extendAccess(businessId, d))}
          disabled={pending}
          className="rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-green hover:text-green"
        >
          +{d}g
        </button>
      ))}
      <button
        onClick={() => {
          const v = prompt("Kaç gün uzatılsın? (eksi değer kısaltır)");
          if (v === null) return;
          const days = parseInt(v, 10);
          if (Number.isFinite(days)) run(() => extendAccess(businessId, days));
        }}
        disabled={pending}
        className="rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-green hover:text-green"
      >
        özel
      </button>

      {/* Paket */}
      <select
        value={plan}
        disabled={pending}
        onChange={(e) => run(() => setPlan(businessId, e.target.value as PlanId))}
        className={selectCls}
        title="Paket değiştir"
      >
        {PLANS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Durum */}
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          run(() =>
            setStatus(businessId, e.target.value as Parameters<typeof setStatus>[1]),
          )
        }
        className={selectCls}
        title="Durum değiştir"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Şifre sıfırla */}
      {ownerId && (
        <button
          onClick={() => {
            const pw = prompt(
              "Bu işletme için yeni şifre belirle (en az 6 karakter):",
            );
            if (pw === null) return;
            if (pw.length < 6) {
              alert("Şifre en az 6 karakter olmalı.");
              return;
            }
            startTransition(async () => {
              await resetUserPassword(ownerId, pw);
              alert(
                `Şifre sıfırlandı ✓\n\nYeni şifre: ${pw}\n\nBu şifreyi işletme sahibine iletin.`,
              );
            });
          }}
          disabled={pending}
          className="rounded-md border border-border px-2 py-1 text-xs text-muted transition hover:border-orange hover:text-orange"
        >
          Şifre sıfırla
        </button>
      )}

      {/* Sil (kalıcı) */}
      <button
        onClick={() => {
          const typed = prompt(
            `⚠️ KALICI SİLME\n\n"${businessName}" işletmesini, tüm menüsünü, fotoğraflarını ve sahip hesabını kalıcı olarak siler. Bu işlem GERİ ALINAMAZ.\n\nOnaylamak için işletme adını birebir yazın:`,
          );
          if (typed === null) return;
          if (typed.trim() !== businessName) {
            alert("Ad eşleşmedi, silme iptal edildi.");
            return;
          }
          run(() => deleteBusiness(businessId));
        }}
        disabled={pending}
        className="rounded-md border border-orange/60 px-2 py-1 text-xs font-medium text-orange transition hover:bg-orange hover:text-black"
      >
        Sil
      </button>
    </div>
  );
}
