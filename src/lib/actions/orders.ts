"use server";

import { prisma } from "@/lib/db";
import { requireOrderingBusiness } from "@/lib/orders/guard";
import {
  transitionOrderStatus,
  updatePaymentStatus,
  updateServiceRequestStatus,
  closeTableSession,
  OrderError,
  type OrderDTO,
} from "@/lib/orders/service";
import type { OrderStatus } from "@/lib/orders/types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof OrderError ? e.message : "İşlem başarısız.",
});

/** Sipariş durumu değiştir (kabul/ret/hazırlan/hazır/teslim/iptal). */
export async function setOrderStatus(
  orderId: string,
  to: OrderStatus,
  reason?: string,
): Promise<ActionResult<OrderDTO>> {
  try {
    const { user, business } = await requireOrderingBusiness();
    const data = await transitionOrderStatus({
      businessId: business.id,
      orderId,
      to,
      byUserId: user.id,
      reason,
    });
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

/** Ödeme durumu değiştir. */
export async function setPaymentStatus(
  orderId: string,
  status: "unpaid" | "payment_requested" | "paid" | "partially_paid" | "refunded",
  method?: string,
): Promise<ActionResult<OrderDTO>> {
  try {
    const { business } = await requireOrderingBusiness();
    const data = await updatePaymentStatus(business.id, orderId, status, method);
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

/** Servis talebini işle (geldi / tamam / iptal). */
export async function handleServiceRequest(
  id: string,
  status: "acknowledged" | "completed" | "cancelled",
): Promise<ActionResult> {
  try {
    const { user, business } = await requireOrderingBusiness();
    await updateServiceRequestStatus(business.id, id, status, user.id);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

/** Mutfak fişi yazdırma kaydı (yazdırma geçmişi). */
export async function logPrint(orderId: string): Promise<ActionResult> {
  try {
    const { business } = await requireOrderingBusiness();
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: business.id },
      select: { id: true },
    });
    if (!order) return { ok: false, error: "Sipariş bulunamadı." };
    await prisma.printJob.create({ data: { orderId: order.id } });
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

/** Masa hesabını kapat. */
export async function closeTable(tableId: string): Promise<ActionResult> {
  try {
    const { user, business } = await requireOrderingBusiness();
    await closeTableSession(business.id, tableId, user.id);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}
