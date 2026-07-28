import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;
  const b = user.business;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Ayarlar</h1>
          <p className="mt-1 text-muted">
            İşletme bilgilerin menünün üstünde ve bilgi panelinde görünür.
          </p>
        </div>
        <Link
          href={`/m/${b.slug}`}
          target="_blank"
          className="rounded-lg border border-border px-4 py-2 text-sm text-fg transition hover:border-green/50"
        >
          Menüyü önizle ↗
        </Link>
      </div>

      <div className="mt-6">
        <SettingsForm
          business={{
            name: b.name,
            description: b.description,
            phone: b.phone,
            address: b.address,
            mapsUrl: b.mapsUrl,
            instagram: b.instagram,
            wifiName: b.wifiName,
            wifiPassword: b.wifiPassword,
            workingHours: b.workingHours,
            logoUrl: b.logoUrl,
            coverUrl: b.coverUrl,
          }}
        />
      </div>
    </div>
  );
}
