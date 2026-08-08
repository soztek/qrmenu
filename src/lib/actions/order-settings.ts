"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrderingBusiness } from "@/lib/orders/guard";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export interface OrderSettingsInput {
  qrOrderingEnabled: boolean;
  acceptMode: "staff" | "auto";
  callWaiterEnabled: boolean;
  requestBillEnabled: boolean;
  askCustomerName: boolean;
  allowNotes: boolean;
  stockControl: boolean;
  soundEnabled: boolean;
  kitchenEnabled: boolean;
  minOrderTotal?: string;
  acceptFrom?: string;
  acceptTo?: string;
  prepWarnMins?: number;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateOrderSettings(
  input: OrderSettingsInput,
): Promise<SettingsResult> {
  const { business } = await requireOrderingBusiness();

  const min = input.minOrderTotal?.trim()
    ? Number(input.minOrderTotal.replace(",", "."))
    : null;
  const from = input.acceptFrom && HHMM.test(input.acceptFrom) ? input.acceptFrom : null;
  const to = input.acceptTo && HHMM.test(input.acceptTo) ? input.acceptTo : null;

  const data = {
    qrOrderingEnabled: input.qrOrderingEnabled,
    acceptMode: input.acceptMode,
    callWaiterEnabled: input.callWaiterEnabled,
    requestBillEnabled: input.requestBillEnabled,
    askCustomerName: input.askCustomerName,
    allowNotes: input.allowNotes,
    stockControl: input.stockControl,
    soundEnabled: input.soundEnabled,
    kitchenEnabled: input.kitchenEnabled,
    minOrderTotal: min != null && Number.isFinite(min) && min > 0 ? min.toFixed(2) : null,
    acceptFrom: from,
    acceptTo: to,
    prepWarnMins: Math.max(1, Math.min(240, Math.floor(input.prepWarnMins ?? 15))),
  };

  await prisma.orderSettings.upsert({
    where: { businessId: business.id },
    update: data,
    create: { businessId: business.id, ...data },
  });

  revalidatePath("/dashboard/siparis-ayarlari");
  revalidatePath(`/m/${business.slug}`);
  return { ok: true };
}
