import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, TRIAL_DAYS, type PlanId } from "@/lib/plans";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Kayıt ol" };

const VALID_PLANS: PlanId[] = ["starter", "pro", "premium"];

export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  // Zaten giriş yapmışsa panele gönder.
  if (await getCurrentUser()) redirect("/dashboard");

  const { plan: rawPlan } = await searchParams;
  const plan = VALID_PLANS.includes(rawPlan as PlanId)
    ? (rawPlan as PlanId)
    : undefined;
  const selectedPlan = plan ? getPlan(plan) : undefined;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Hesap oluştur</h1>
        <p className="mt-1.5 text-sm text-muted">
          {selectedPlan ? (
            <>
              <span className="font-medium text-fg">{selectedPlan.name}</span>{" "}
              paketiyle {TRIAL_DAYS} günlük ücretsiz denemeniz başlıyor.
            </>
          ) : (
            <>{TRIAL_DAYS} gün ücretsiz — kart bilgisi istemiyoruz.</>
          )}
        </p>

        <div className="mt-6">
          <RegisterForm plan={plan} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-green hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
