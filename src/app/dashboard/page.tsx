import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { trialDaysLeft, statusLabel } from "@/lib/subscription";

export const metadata: Metadata = { title: "Genel bakış" };

export default async function DashboardHome() {
  const user = await getCurrentUser();
  // Layout zaten koruyor; tip daraltma için:
  if (!user?.business) return null;

  const business = user.business;
  const plan = getPlan(business.plan);
  const menuUrl = `/m/${business.slug}`;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Hoş geldin{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
      </h1>
      <p className="mt-1 text-muted">
        {business.name} panelin hazır. Sıradaki adım: menünü oluştur.
      </p>

      {/* Durum kartları */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Paket" value={plan.name} />
        <Stat label="Durum" value={statusLabel(business)} />
        <Stat
          label="Menü adresi"
          value={
            <span className="break-all font-mono text-xs text-green">
              {menuUrl}
            </span>
          }
        />
      </div>

      {/* Sonraki adımlar */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Kuruluma başla</h2>
        <ol className="mt-4 space-y-3 text-sm">
          <Step done title="Hesabını oluşturdun" />
          <Step
            title="Menünü oluştur"
            hint={`${trialDaysLeft(business)} günlük denemende kategori ve ürünlerini ekle`}
          />
          <Step title="QR kodunu indir ve masaya koy" />
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/menu"
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Menüyü oluştur
          </Link>
          <Link
            href="/dashboard/qr"
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
          >
            QR kodu gör
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-1.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Step({
  title,
  hint,
  done,
}: {
  title: string;
  hint?: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
          done ? "bg-green text-black" : "border border-border text-faint"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div>
        <div className={done ? "text-muted line-through" : "font-medium"}>
          {title}
        </div>
        {hint && <div className="text-xs text-faint">{hint}</div>}
      </div>
    </li>
  );
}
