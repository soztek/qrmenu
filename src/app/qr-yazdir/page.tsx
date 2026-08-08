import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { menuUrl } from "@/lib/url";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "QR yazdır" };
export const dynamic = "force-dynamic";

const SIZES: Record<string, number> = { s: 40, m: 55, l: 75 }; // mm

export default async function QrPrintPage({
  searchParams,
}: {
  searchParams: Promise<{
    b?: string;
    count?: string;
    size?: string;
    style?: string;
    text?: string;
    mode?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const sp = await searchParams;

  // Admin ?b=<işletmeId> ile başka işletmenin QR'ını basabilir.
  let business;
  if (sp.b && isAdmin(user)) {
    business = await prisma.business.findUnique({ where: { id: sp.b } });
    if (!business) notFound();
  } else {
    if (!user.business) redirect("/dashboard");
    business = user.business;
  }

  const count = Math.min(60, Math.max(1, parseInt(sp.count ?? "1", 10) || 1));
  const sizeMm = SIZES[sp.size ?? "m"] ?? 55;
  const style = sp.style === "qr" ? "qr" : "stand";
  const promo =
    (sp.text ?? "").trim() ||
    "Menümüz artık dijital! QR'ı okutun, menümüzü telefonunuzdan görün.";

  const mode = sp.mode === "tables" ? "tables" : "single";
  const url = menuUrl(business.slug);
  const qr = await QRCode.toDataURL(url, {
    width: 700,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const cards = Array.from({ length: count });

  // Tüm masa standları modu: her masa kendi QR'ı ile
  const tableCards: { label: string; qr: string }[] = [];
  if (mode === "tables") {
    const tables = await prisma.restaurantTable.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { createdAt: "asc" },
      select: { label: true, qrToken: true },
    });
    for (const t of tables) {
      const q = await QRCode.toDataURL(`${url}?t=${t.qrToken}`, {
        width: 700,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      tableCards.push({ label: t.label, qr: q });
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Ekran üstü kontrol çubuğu (baskıda gizli) */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3">
        <div className="text-sm text-neutral-600">
          {mode === "tables"
            ? `${tableCards.length} masa standı (her masa kendi QR'ı)`
            : `${count} adet · ${sizeMm}mm QR · ${style === "stand" ? "Masa standı kartı" : "Sadece QR"}`}
        </div>
        <div className="flex items-center gap-3">
          <a href="/dashboard/qr" className="text-sm text-neutral-500 hover:text-black">
            ← Geri
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] p-[8mm]">
        {mode === "tables" ? (
          tableCards.length === 0 ? (
            <p className="p-10 text-center text-neutral-500">
              Aktif masa yok. Önce “Masalar” sayfasından masa ekleyin.
            </p>
          ) : (
            <div className="flex flex-wrap gap-[8mm]">
              {tableCards.map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center"
                  style={{
                    width: "90mm",
                    breakInside: "avoid",
                    border: "1.5pt solid #111",
                    borderRadius: "6mm",
                    padding: "8mm 6mm",
                  }}
                >
                  <div className="text-[13pt] font-semibold text-neutral-700">
                    {business.name}
                  </div>
                  <div className="mt-[1mm] text-[20pt] font-extrabold tracking-tight">
                    {t.label}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.qr}
                    alt="QR"
                    className="mt-[4mm]"
                    style={{ width: "55mm", height: "55mm" }}
                  />
                  <div className="mt-[4mm] text-[11pt] font-semibold">
                    📱 Menü & sipariş için okutun
                  </div>
                  <div className="mt-[3mm] border-t border-neutral-200 pt-[2mm] text-[7.5pt] font-semibold tracking-wide text-neutral-400">
                    SÖZTEK QR MENÜ
                  </div>
                </div>
              ))}
            </div>
          )
        ) : style === "qr" ? (
          <div className="flex flex-wrap gap-[6mm]">
            {cards.map((_, i) => (
              <div
                key={i}
                className="text-center"
                style={{ breakInside: "avoid", padding: "3mm" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="QR"
                  style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
                />
                <div className="mt-[2mm] text-[9pt] font-semibold">{business.name}</div>
                <div className="text-[7pt] text-neutral-500">Menü için okutun</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-[8mm]">
            {cards.map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center"
                style={{
                  width: "90mm",
                  breakInside: "avoid",
                  border: "1.5pt solid #111",
                  borderRadius: "6mm",
                  padding: "8mm 6mm",
                }}
              >
                <div className="text-[15pt] font-extrabold tracking-tight">
                  {business.name}
                </div>
                <div className="mt-[3mm] text-[10.5pt] font-medium leading-snug text-neutral-800">
                  {promo}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="QR"
                  className="mt-[5mm]"
                  style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }}
                />
                <div className="mt-[4mm] text-[10pt] font-semibold">
                  📱 QR&apos;ı telefonunuzla okutun
                </div>
                <div className="mt-[1mm] break-all text-[7.5pt] text-neutral-500">
                  {url}
                </div>
                <div className="mt-[4mm] border-t border-neutral-200 pt-[2mm] text-[7.5pt] font-semibold tracking-wide text-neutral-400">
                  SÖZTEK QR MENÜ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
