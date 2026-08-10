import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReceiptPrint } from "./receipt-print";

export const metadata: Metadata = { title: "Mutfak fişi" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.business) redirect("/giris");

  const order = await prisma.order.findFirst({
    where: { id, businessId: user.business.id },
    include: {
      items: { include: { modifiers: true }, orderBy: { createdAt: "asc" } },
      printJobs: { orderBy: { printedAt: "desc" }, take: 1 },
      _count: { select: { printJobs: true } },
    },
  });
  if (!order) notFound();

  const time = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);
  const lastPrint = order.printJobs[0]?.printedAt
    ? new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(order.printJobs[0].printedAt)
    : null;

  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      {/* Araç çubuğu — baskıda gizli */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-300 bg-white px-5 py-3">
        <Link href="/dashboard/mutfak" className="text-sm text-neutral-500 hover:text-black">
          ← Mutfak
        </Link>
        <div className="flex items-center gap-3">
          {order._count.printJobs > 0 && (
            <span className="text-xs text-neutral-500">
              {order._count.printJobs}. baskı{lastPrint ? ` · son: ${lastPrint}` : ""}
            </span>
          )}
          <ReceiptPrint orderId={order.id} />
        </div>
      </div>

      {/* Fiş (80mm termal) */}
      <div className="print-sheet mx-auto my-6 w-[80mm] max-w-full bg-white p-4 font-mono text-[12px] leading-tight text-black shadow-sm">
        <div className="text-center">
          <div className="text-base font-bold uppercase">{user.business.name}</div>
          <div className="mt-1 text-[11px]">MUTFAK FİŞİ</div>
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between">
          <span>Sipariş</span>
          <span className="text-base font-bold">{order.code}</span>
        </div>
        <div className="flex justify-between">
          <span>Masa</span>
          <span className="font-bold">{order.tableLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Saat</span>
          <span>{time}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between">
            <span>Müşteri</span>
            <span>{order.customerName}</span>
          </div>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        {order.items.map((it) => (
          <div key={it.id} className="mb-2">
            <div className="text-[13px] font-bold">
              {it.quantity} x {it.name}
            </div>
            {it.modifiers.map((m, i) => (
              <div key={i} className="pl-3">
                - {m.name}
              </div>
            ))}
            {it.note && <div className="pl-3 font-bold">! {it.note}</div>}
          </div>
        ))}

        {order.note && (
          <>
            <div className="my-2 border-t border-dashed border-black" />
            <div className="font-bold">NOT: {order.note}</div>
          </>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        <div className="text-center text-[10px]">Söztek QR Menü</div>
      </div>
    </div>
  );
}
