import "server-only";
import { prisma } from "@/lib/db";
import { planHasFeature } from "@/lib/plans";
import { hasActiveAccess } from "@/lib/subscription";

/**
 * Müşteri sipariş bağlamı — masa QR token'ı geçerli ve işletme aktif Pro/Premium
 * + QR sipariş açıksa döner; aksi halde null (normal menü gösterilir).
 */
export interface OrderModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
}
export interface OrderModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: OrderModifierOption[];
}
export interface OrderMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  photoUrl: string | null;
  prepMinutes: number | null;
  orderable: boolean;
  groups: OrderModifierGroup[];
}
export interface OrderMenuCategory {
  id: string;
  name: string;
  items: OrderMenuItem[];
}
export interface OrderContext {
  business: { name: string; slug: string; currency: string };
  table: { label: string; token: string };
  settings: {
    askCustomerName: boolean;
    allowNotes: boolean;
    minOrderTotal: number | null;
    callWaiter: boolean;
    requestBill: boolean;
  };
  categories: OrderMenuCategory[];
}

export async function loadOrderContext(
  slug: string,
  token: string,
): Promise<OrderContext | null> {
  const biz = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      orderSettings: true,
    },
  });
  if (!biz) return null;
  const s = biz.orderSettings;
  if (!s?.qrOrderingEnabled) return null;
  if (!planHasFeature(biz.plan, "orders") || !hasActiveAccess(biz)) return null;

  const table = await prisma.restaurantTable.findFirst({
    where: { qrToken: token, businessId: biz.id },
    select: { id: true, label: true, active: true },
  });
  if (!table || !table.active) return null;

  const cats = await prisma.category.findMany({
    where: { businessId: biz.id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          discountPrice: true,
          photoUrl: true,
          prepMinutes: true,
          isOrderable: true,
          stockStatus: true,
          stockQty: true,
          modifierGroups: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              required: true,
              minSelect: true,
              maxSelect: true,
              options: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, name: true, priceDelta: true, isAvailable: true },
              },
            },
          },
        },
      },
    },
  });

  const categories: OrderMenuCategory[] = cats
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => {
        const orderable =
          i.isOrderable &&
          i.stockStatus === "in_stock" &&
          (i.stockQty == null || i.stockQty > 0);
        return {
          id: i.id,
          name: i.name,
          description: i.description,
          price: Number(i.price),
          discountPrice: i.discountPrice != null ? Number(i.discountPrice) : null,
          photoUrl: i.photoUrl,
          prepMinutes: i.prepMinutes,
          orderable,
          groups: i.modifierGroups.map((g) => ({
            id: g.id,
            name: g.name,
            required: g.required,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: g.options.map((o) => ({
              id: o.id,
              name: o.name,
              priceDelta: Number(o.priceDelta),
              available: o.isAvailable,
            })),
          })),
        };
      }),
    }))
    .filter((c) => c.items.length > 0);

  return {
    business: { name: biz.name, slug: biz.slug, currency: s.currency || "TRY" },
    table: { label: table.label, token },
    settings: {
      askCustomerName: s.askCustomerName,
      allowNotes: s.allowNotes,
      minOrderTotal: s.minOrderTotal != null ? Number(s.minOrderTotal) : null,
      callWaiter: s.callWaiterEnabled,
      requestBill: s.requestBillEnabled,
    },
    categories,
  };
}
