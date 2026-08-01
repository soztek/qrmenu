"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateBusiness, type BusinessState } from "@/lib/actions/business";
import { PhotoUpload } from "@/components/photo-upload";
import { MENU_THEMES } from "@/lib/themes";

const TR: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
};
/** Menü adresi önizlemesi için hafif temizleme (sunucu asıl doğrulamayı yapar). */
function cleanSlug(v: string): string {
  return v
    .split("")
    .map((c) => TR[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-faint focus:border-green focus:ring-2 focus:ring-green/20";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export interface BusinessData {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  mapsUrl: string | null;
  instagram: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  workingHours: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  menuTheme: string;
  slug: string;
}

export function SettingsForm({ business }: { business: BusinessData }) {
  const [state, action, pending] = useActionState<BusinessState, FormData>(
    updateBusiness,
    {},
  );
  const router = useRouter();
  const [theme, setTheme] = useState(business.menuTheme || "dark");
  const [slug, setSlug] = useState(business.slug);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      router.refresh(); // slug normalize olduysa önizleme/link güncellensin
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-8">
      {/* Genel */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Genel bilgiler</h2>
        <div className="mt-4 space-y-4">
          <Field label="İşletme adı" name="name" defaultValue={business.name} />

          {/* Menü adresi (slug) */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-muted">
              Menü adresi (kısa ad)
            </span>
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-surface-2 focus-within:border-green focus-within:ring-2 focus-within:ring-green/20">
              <span className="whitespace-nowrap border-r border-border px-3 py-2.5 text-sm text-faint">
                soztekqrmenu.com.tr/m/
              </span>
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(cleanSlug(e.target.value))}
                placeholder="soztek"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-fg outline-none placeholder:text-faint"
              />
            </div>
            <span className="mt-1 block text-xs text-faint">
              Menün şu adreste açılır:{" "}
              <span className="font-mono text-green">
                soztekqrmenu.com.tr/m/{slug || "…"}
              </span>
              . ⚠️ Değiştirirsen eski QR kodların ve linkler çalışmaz — QR'ı{" "}
              <b>yeniden indir</b>.
            </span>
          </div>

          <Field
            label="Kısa açıklama"
            name="description"
            defaultValue={business.description}
            placeholder="Ör. Ardahan'ın en taze lezzetleri"
          />
          <PhotoUpload name="logoUrl" label="Logo" initialUrl={business.logoUrl} />
          <PhotoUpload
            name="coverUrl"
            label="Üst banner (3:1)"
            cropTo={3}
            initialUrl={business.coverUrl}
            hint="En iyi sonuç için geniş (yatay) bir görsel yükleyin; otomatik 3:1 (1200×400) olarak kırpılır. Menünün ve PDF'in en üstünde tam genişlikte görünür."
          />
        </div>
      </section>

      {/* Menü teması */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Menü teması</h2>
        <p className="mt-1 text-sm text-muted">
          Müşterilerin QR okutunca göreceği menünün renk teması.
        </p>
        <input type="hidden" name="menuTheme" value={theme} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MENU_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                theme === t.id
                  ? "border-green ring-2 ring-green/30"
                  : "border-border hover:border-green/40"
              }`}
            >
              <span className="flex shrink-0 overflow-hidden rounded-lg border border-border">
                {t.swatch.map((c, i) => (
                  <span key={i} style={{ background: c }} className="h-11 w-5" />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {t.label}
                  {theme === t.id && <span className="text-green"> ✓</span>}
                </span>
                <span className="block text-xs text-faint">{t.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* İletişim */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">İletişim & konum</h2>
        <p className="mt-1 text-sm text-muted">
          Menüdeki bilgi panelinde müşterilere gösterilir.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" name="phone" defaultValue={business.phone} placeholder="0 (5xx) xxx xx xx" />
          <Field
            label="WhatsApp numarası"
            name="whatsapp"
            defaultValue={business.whatsapp}
            placeholder="0 (5xx) xxx xx xx"
            hint="Menüde yeşil WhatsApp butonu olarak görünür (tıkla-yaz)."
          />
          <Field
            label="Instagram"
            name="instagram"
            defaultValue={business.instagram}
            placeholder="kullaniciadi"
          />
          <Field label="Adres" name="address" defaultValue={business.address} />
          <Field
            label="Google Maps linki"
            name="mapsUrl"
            defaultValue={business.mapsUrl}
            placeholder="https://maps.app.goo.gl/..."
          />
          <Field
            label="Çalışma saatleri"
            name="workingHours"
            defaultValue={business.workingHours}
            placeholder="Her gün 09:00 - 23:00"
          />
        </div>
      </section>

      {/* WiFi */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">WiFi</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="WiFi adı (SSID)" name="wifiName" defaultValue={business.wifiName} />
          <Field label="WiFi şifresi" name="wifiPassword" defaultValue={business.wifiPassword} />
        </div>
      </section>

      {/* Kaydet */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-green-dark disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {saved && <span className="text-sm text-green">Kaydedildi ✓</span>}
        {state.error && <span className="text-sm text-orange">{state.error}</span>}
      </div>
    </form>
  );
}
