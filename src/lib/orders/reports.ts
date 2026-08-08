import "server-only";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/enums";

const CANCELLED: OrderStatus[] = ["cancelled", "rejected"];

export interface Reports {
  days: number;
  count: number;
  revenue: number;
  avg: number;
  collected: number;
  cancelled: number;
  topItems: { name: string; qty: number; revenue: number }[];
  byTable: { label: string; total: number; count: number }[];
  daily: { date: string; total: number }[];
}

/** İşletme bazlı satış raporları (son N gün). İptal/red ciroya sayılmaz. */
export async function getReports(businessId: string, days: number): Promise<Reports> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const revenueWhere = {
    businessId,
    createdAt: { gte: start },
    status: { notIn: CANCELLED },
  };

  const [agg, cancelled, topItems, byTable, orders] = await Promise.all([
    prisma.order.aggregate({ where: revenueWhere, _count: true, _sum: { total: true } }),
    prisma.order.count({
      where: {
        businessId,
        createdAt: { gte: start },
        status: { in: CANCELLED },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          businessId,
          createdAt: { gte: start },
          status: { notIn: CANCELLED },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 12,
    }),
    prisma.order.groupBy({
      by: ["tableLabel"],
      where: revenueWhere,
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 12,
    }),
    prisma.order.findMany({
      where: revenueWhere,
      select: { total: true, createdAt: true, paymentStatus: true },
    }),
  ]);

  const count = agg._count;
  const revenue = Number(agg._sum.total ?? 0);
  const collected = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + Number(o.total), 0);

  // Günlük ciro
  const dayMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const k = o.createdAt.toISOString().slice(0, 10);
    if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) ?? 0) + Number(o.total));
  }

  return {
    days,
    count,
    revenue,
    avg: count ? revenue / count : 0,
    collected,
    cancelled,
    topItems: topItems.map((t) => ({
      name: t.name,
      qty: Number(t._sum.quantity ?? 0),
      revenue: Number(t._sum.lineTotal ?? 0),
    })),
    byTable: byTable.map((t) => ({
      label: t.tableLabel,
      total: Number(t._sum.total ?? 0),
      count: t._count,
    })),
    daily: [...dayMap.entries()].map(([date, total]) => ({ date, total })),
  };
}
