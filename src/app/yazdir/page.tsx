import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTL, menuUrl } from "@/lib/url";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Yazdırılabilir menü" };
export const dynamic = "force-dynamic";

export default async function PrintMenuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!user.business) redirect("/dashboard");
  const business = user.business;

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  const filled = categories.filter((c) => c.items.length > 0);

  const url = menuUrl(business.slug);
  const qr = await QRCode.toDataURL(url, {
    width: 300,
    margin: 1,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Araç çubuğu — baskıda gizli */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-300 bg-white px-5 py-3">
        <Link
          href="/dashboard/menu"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Menüye dön
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-500 sm:block">
            Açılan pencerede “PDF olarak kaydet”i seçebilirsin
          </span>
          <PrintButton />
        </div>
      </div>

      {/* Yazdırılacak sayfa */}
      <div className="print-sheet mx-auto my-6 max-w-2xl bg-white px-10 py-12 shadow-sm">
        <header className="border-b-2 border-neutral-900 pb-5 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{business.name}</h1>
          {business.description && (
            <p className="mt-1 text-sm text-neutral-500">{business.description}</p>
          )}
          {(business.phone || business.address) && (
            <p className="mt-2 text-xs text-neutral-500">
              {[business.phone, business.address].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>

        {filled.length === 0 ? (
          <p className="py-20 text-center text-neutral-400">Menüde ürün yok.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {filled.map((c) => (
              <section key={c.id} className="break-inside-avoid">
                <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-neutral-800">
                  {c.name}
                </h2>
                <div className="space-y-2.5">
                  {c.items.map((item) => (
                    <div key={item.id} className="break-inside-avoid">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-neutral-900">
                          {item.name}
                        </span>
                        <span className="flex-1 border-b border-dotted border-neutral-300" />
                        <span className="font-semibold text-neutral-900">
                          {formatTL(item.price.toString())}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* QR — dijital menüye geçiş */}
        <div className="mt-10 flex break-inside-avoid flex-col items-center border-t border-neutral-200 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Menü QR kodu" width={104} height={104} />
          <p className="mt-2 text-sm font-semibold text-neutral-800">
            📱 Fotoğraflı dijital menü için okutun
          </p>
          <p className="text-xs text-neutral-400">{url}</p>
        </div>

        <footer className="mt-6 text-center text-[11px] text-neutral-400">
          {business.name} · Söztek QR Menü ile hazırlandı
        </footer>
      </div>
    </div>
  );
}
