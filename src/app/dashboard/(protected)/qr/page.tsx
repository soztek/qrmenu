import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { menuUrl } from "@/lib/url";
import { QrDownload, CopyLink, LockedQrActions } from "./qr-actions";
import { QrPrintForm } from "./qr-print-form";

export const metadata: Metadata = { title: "QR Kod" };

export default async function QrPage() {
  const user = await getCurrentUser();
  if (!user?.business) return null;

  const url = menuUrl(user.business.slug);
  const paid = user.business.subscriptionStatus === "active";
  const filename = `${user.business.slug}-qr.png`;

  const dataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: "#0a0a0b", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">QR Kodun</h1>
      <p className="mt-1 text-muted">
        {paid
          ? "Bu kodu yazdırıp masalarına koy. Müşterilerin okuttuğunda menün açılır."
          : "QR kodunu buradan önizleyebilirsin."}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto rounded-2xl border border-border bg-white p-4">
          <Image
            src={dataUrl}
            alt="Menü QR kodu"
            width={220}
            height={220}
            unoptimized
            className="h-[220px] w-[220px]"
          />
          {!paid && (
            <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-orange">
              Deneme — önizleme
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-faint">Menü adresin</div>
          <Link
            href={`/m/${user.business.slug}`}
            target="_blank"
            className="mt-1 block break-all font-mono text-sm text-green hover:underline"
          >
            {url}
          </Link>

          {paid ? (
            <>
              <div className="mt-5 flex flex-wrap gap-3">
                <QrDownload dataUrl={dataUrl} filename={filename} />
                <CopyLink url={url} />
              </div>
              <p className="mt-4 text-sm text-muted">
                İpucu: Kodu bir masa kartına veya afişe basabilirsin. Menünü
                güncellediğinde QR değişmez — aynı kod her zaman güncel menüyü gösterir.
              </p>
            </>
          ) : (
            <>
              <div className="mt-4 rounded-xl border border-orange/40 bg-orange/10 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-fg">
                  🔒 QR kodu ücretli pakete özeldir
                </div>
                <p className="mt-1 text-muted">
                  Deneme sürümünde QR indirilemez, kopyalanamaz ve yazdırılamaz.
                  Menünüzü QR ile masalarınıza koymak için lütfen üretici ile görüşerek
                  paketinizi yükseltin.
                </p>
              </div>
              <LockedQrActions />
              <div className="mt-3">
                <Link
                  href="/dashboard/abonelik"
                  className="inline-block rounded-lg bg-green px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-dark"
                >
                  Paketi yükselt
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {paid && <QrPrintForm />}
    </div>
  );
}
