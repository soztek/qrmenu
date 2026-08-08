import "server-only";
import { prisma } from "@/lib/db";
import { planHasFeature } from "@/lib/plans";
import { hasActiveAccess } from "@/lib/subscription";
import { canTransition, reasonRequired, type OrderStatus } from "./types";

/** Kullanıcıya gösterilebilir hata (kod + mesaj). */
export class OrderError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export interface CreateOrderInput {
  tableToken: string;
  idempotencyKey: string;
  customerName?: string;
  note?: string;
  items: { menuItemId: string; quantity: number; note?: string; optionIds?: string[] }[];
}

const ORDER_SELECT = {
  id: true,
  code: true,
  status: true,
  paymentStatus: true,
  tableLabel: true,
  customerName: true,
  note: true,
  subtotal: true,
  discount: true,
  total: true,
  createdAt: true,
  acceptedAt: true,
  readyAt: true,
  servedAt: true,
  items: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
      note: true,
      modifiers: { select: { groupName: true, name: true, price: true } },
    },
  },
} as const;

const num = (v: unknown) => Number(v);

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(o: any) {
  return {
    id: o.id as string,
    code: o.code as string,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus as string,
    tableLabel: o.tableLabel as string,
    customerName: (o.customerName ?? null) as string | null,
    note: (o.note ?? null) as string | null,
    subtotal: num(o.subtotal),
    discount: num(o.discount),
    total: num(o.total),
    createdAt: (o.createdAt as Date).toISOString(),
    acceptedAt: o.acceptedAt ? (o.acceptedAt as Date).toISOString() : null,
    readyAt: o.readyAt ? (o.readyAt as Date).toISOString() : null,
    servedAt: o.servedAt ? (o.servedAt as Date).toISOString() : null,
    items: (o.items as any[]).map((it) => ({
      id: it.id as string,
      name: it.name as string,
      imageUrl: (it.imageUrl ?? null) as string | null,
      unitPrice: num(it.unitPrice),
      quantity: it.quantity as number,
      lineTotal: num(it.lineTotal),
      note: (it.note ?? null) as string | null,
      modifiers: (it.modifiers as any[]).map((m) => ({
        groupName: (m.groupName ?? null) as string | null,
        name: m.name as string,
        price: num(m.price),
      })),
    })),
  };
}
export type OrderDTO = ReturnType<typeof mapOrder>;

/** "14:30" formatında sipariş saatleri kontrolü (Europe/Istanbul). */
function withinHours(from?: string | null, to?: string | null): boolean {
  if (!from || !to) return true;
  const now = new Date().toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  return from <= to ? now >= from && now <= to : now >= from || now <= to;
}

const toKurus = (v: unknown) => Math.round(Number(v) * 100);
const fromKurus = (k: number) => (k / 100).toFixed(2);

/** QR token → masa + işletme çözümü (menü için de kullanılır). */
export async function resolveTableByToken(token: string) {
  const table = await prisma.restaurantTable.findUnique({
    where: { qrToken: token },
    include: { business: { include: { orderSettings: true } } },
  });
  if (!table) throw new OrderError("Masa bulunamadı veya QR geçersiz.", "invalid");
  if (!table.active) throw new OrderError("Bu masa QR kodu şu an pasif.", "inactive");
  return table;
}

/** Sipariş oluştur — idempotent, backend fiyat, atomik stok, tek açık oturum. */
export async function createOrder(input: CreateOrderInput): Promise<OrderDTO> {
  // 1) İdempotency: aynı anahtarla sipariş zaten var mı?
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: ORDER_SELECT,
  });
  if (existing) return mapOrder(existing);

  // 2) Masa + işletme + ayarlar
  const table = await resolveTableByToken(input.tableToken);
  const business = table.business;
  const settings = business.orderSettings;
  if (!settings?.qrOrderingEnabled) {
    throw new OrderError("Bu işletme şu an QR ile sipariş almıyor.", "disabled");
  }
  if (!planHasFeature(business.plan, "orders") || !hasActiveAccess(business)) {
    throw new OrderError("Sipariş özelliği bu işletmede aktif değil.", "plan");
  }
  if (!withinHours(settings.acceptFrom, settings.acceptTo)) {
    throw new OrderError("Şu an sipariş saatleri dışındayız.", "hours");
  }
  if (!input.items?.length) throw new OrderError("Sepetiniz boş.", "empty");

  // 3) Ürünleri çek (işletmeye izole) + seçenekler
  const ids = [...new Set(input.items.map((i) => i.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: ids }, businessId: business.id },
    include: { modifierGroups: { include: { options: true } } },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  // 4) Doğrula + backend fiyat (kuruş)
  const prepared: {
    mi: (typeof menuItems)[number];
    qty: number;
    unitKurus: number;
    lineTotalKurus: number;
    note: string | null;
    mods: { groupName: string; name: string; price: string }[];
  }[] = [];
  let subtotalKurus = 0;

  for (const line of input.items) {
    const mi = byId.get(line.menuItemId);
    if (!mi) throw new OrderError("Bir ürün menüde bulunamadı.", "item");
    const qty = Math.max(1, Math.min(99, Math.floor(line.quantity || 1)));

    if (!mi.isAvailable || !mi.isOrderable || mi.stockStatus !== "in_stock") {
      throw new OrderError(`"${mi.name}" şu an sipariş edilemiyor.`, "item");
    }
    if (settings.stockControl && mi.stockQty != null && mi.stockQty < qty) {
      throw new OrderError(`"${mi.name}" için yeterli stok yok.`, "stock");
    }

    const baseKurus = toKurus(mi.discountPrice ?? mi.price);
    const chosen = new Set(line.optionIds ?? []);
    const mods: { groupName: string; name: string; price: string }[] = [];
    let modKurus = 0;

    for (const g of mi.modifierGroups) {
      const picked = g.options.filter((o) => chosen.has(o.id));
      for (const o of picked) {
        if (!o.isAvailable) throw new OrderError(`"${o.name}" seçeneği kapalı.`, "option");
      }
      const minReq = g.required ? Math.max(1, g.minSelect) : g.minSelect;
      if (picked.length < minReq) {
        throw new OrderError(`"${g.name}" için zorunlu seçim yapın.`, "required");
      }
      if (picked.length > g.maxSelect) {
        throw new OrderError(`"${g.name}" için en fazla ${g.maxSelect} seçim.`, "max");
      }
      for (const o of picked) {
        const k = toKurus(o.priceDelta);
        modKurus += k;
        mods.push({ groupName: g.name, name: o.name, price: fromKurus(k) });
      }
    }

    const lineTotalKurus = (baseKurus + modKurus) * qty;
    subtotalKurus += lineTotalKurus;
    prepared.push({
      mi,
      qty,
      unitKurus: baseKurus,
      lineTotalKurus,
      note: settings.allowNotes ? line.note?.slice(0, 300) ?? null : null,
      mods,
    });
  }

  const totalKurus = subtotalKurus; // v1: indirim yok
  if (settings.minOrderTotal != null && totalKurus < toKurus(settings.minOrderTotal)) {
    throw new OrderError(
      `Minimum sipariş tutarı ₺${Number(settings.minOrderTotal).toFixed(0)}.`,
      "min",
    );
  }

  const initialStatus: OrderStatus = settings.acceptMode === "auto" ? "accepted" : "pending";

  // 5) Transaction: oturum + seq/kod + stok + sipariş
  try {
    const order = await prisma.$transaction(async (tx) => {
      let session = await tx.tableSession.findFirst({
        where: { tableId: table.id, status: "active" },
      });
      if (!session) {
        session = await tx.tableSession.create({
          data: {
            businessId: business.id,
            tableId: table.id,
            status: "active",
            customerName: input.customerName?.slice(0, 60) || null,
          },
        });
      }

      const last = await tx.order.aggregate({
        where: { businessId: business.id },
        _max: { seq: true },
      });
      const seq = (last._max.seq ?? 1040) + 1;
      const code = `S-${seq}`;

      // Atomik stok düşümü (overselling koruması)
      if (settings.stockControl) {
        for (const p of prepared) {
          if (p.mi.stockQty != null) {
            const upd = await tx.menuItem.updateMany({
              where: { id: p.mi.id, businessId: business.id, stockQty: { gte: p.qty } },
              data: { stockQty: { decrement: p.qty } },
            });
            if (upd.count !== 1) {
              throw new OrderError(`"${p.mi.name}" stokta kalmadı.`, "stock");
            }
          }
        }
      }

      return tx.order.create({
        data: {
          businessId: business.id,
          tableId: table.id,
          sessionId: session.id,
          tableLabel: table.label,
          code,
          seq,
          status: initialStatus,
          paymentStatus: "unpaid",
          subtotal: fromKurus(subtotalKurus),
          discount: "0",
          total: fromKurus(totalKurus),
          customerName: input.customerName?.slice(0, 60) || null,
          note: settings.allowNotes ? input.note?.slice(0, 500) || null : null,
          idempotencyKey: input.idempotencyKey,
          acceptedAt: initialStatus === "accepted" ? new Date() : null,
          items: {
            create: prepared.map((p) => ({
              menuItemId: p.mi.id,
              name: p.mi.name,
              imageUrl: p.mi.photoUrl,
              unitPrice: fromKurus(p.unitKurus),
              quantity: p.qty,
              lineTotal: fromKurus(p.lineTotalKurus),
              note: p.note,
              stationId: p.mi.stationId,
              modifiers: {
                create: p.mods.map((m) => ({
                  groupName: m.groupName,
                  name: m.name,
                  price: m.price,
                })),
              },
            })),
          },
          events: {
            create: {
              fromStatus: null,
              toStatus: initialStatus,
              reason: settings.acceptMode === "auto" ? "otomatik kabul" : null,
            },
          },
        },
        select: ORDER_SELECT,
      });
    });

    await prisma.restaurantTable
      .update({ where: { id: table.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return mapOrder(order);
  } catch (err) {
    // İdempotency yarışı: aynı anahtar ikinci kez → mevcut siparişi dön.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      const dup = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: ORDER_SELECT,
      });
      if (dup) return mapOrder(dup);
    }
    throw err;
  }
}

/**
 * Masa QR token'ına bağlı AKTİF oturumun siparişleri (müşteri "siparişlerim").
 * Hesap kapatılınca yeni oturum açılır; eski siparişler görünmez.
 */
export async function getSessionOrders(
  token: string,
): Promise<{ tableLabel: string; orders: OrderDTO[] }> {
  const table = await prisma.restaurantTable.findUnique({
    where: { qrToken: token },
    select: { id: true, label: true, active: true },
  });
  if (!table || !table.active) return { tableLabel: "", orders: [] };
  const session = await prisma.tableSession.findFirst({
    where: { tableId: table.id, status: "active" },
    select: { id: true },
  });
  if (!session) return { tableLabel: table.label, orders: [] };
  const orders = await prisma.order.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: ORDER_SELECT,
  });
  return { tableLabel: table.label, orders: orders.map(mapOrder) };
}

/** Müşteri sipariş takibi (tahmin edilemez id ile). */
export async function getCustomerOrder(orderId: string): Promise<OrderDTO | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: ORDER_SELECT,
  });
  return order ? mapOrder(order) : null;
}

/** İşletme: sipariş durum geçişi (izin verilen geçişler + audit + stok iade). */
export async function transitionOrderStatus(opts: {
  businessId: string;
  orderId: string;
  to: OrderStatus;
  byUserId?: string;
  reason?: string;
}): Promise<OrderDTO> {
  const order = await prisma.order.findFirst({
    where: { id: opts.orderId, businessId: opts.businessId },
    select: { id: true, status: true },
  });
  if (!order) throw new OrderError("Sipariş bulunamadı.", "notfound");
  if (!canTransition(order.status, opts.to)) {
    throw new OrderError("Bu sipariş durumuna geçilemez.", "transition");
  }
  if (reasonRequired(opts.to) && !opts.reason?.trim()) {
    throw new OrderError("Lütfen bir neden girin.", "reason");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: {
        status: opts.to,
        ...(opts.to === "accepted" ? { acceptedAt: new Date() } : {}),
        ...(opts.to === "ready" ? { readyAt: new Date() } : {}),
        ...(opts.to === "served" ? { servedAt: new Date() } : {}),
      },
      select: ORDER_SELECT,
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: opts.to,
        byUserId: opts.byUserId ?? null,
        reason: opts.reason?.slice(0, 300) || null,
      },
    });
    // İptal/ret → stok iade
    if (opts.to === "rejected" || opts.to === "cancelled") {
      const items = await tx.orderItem.findMany({
        where: { orderId: order.id, menuItemId: { not: null } },
        select: { menuItemId: true, quantity: true },
      });
      for (const it of items) {
        if (it.menuItemId) {
          await tx.menuItem.updateMany({
            where: { id: it.menuItemId, businessId: opts.businessId, stockQty: { not: null } },
            data: { stockQty: { increment: it.quantity } },
          });
        }
      }
    }
    return o;
  });

  return mapOrder(updated);
}
