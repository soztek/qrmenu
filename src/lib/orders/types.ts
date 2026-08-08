/**
 * Sipariş sistemi — paylaşılan tipler, etiketler ve durum-makinesi.
 * Client + server ortak (server-only YOK).
 */
import type {
  OrderStatus,
  PaymentStatus,
  ServiceRequestType,
  ServiceRequestStatus,
} from "@/generated/prisma/enums";

export type { OrderStatus, PaymentStatus, ServiceRequestType, ServiceRequestStatus };

export type Tone = "muted" | "green" | "orange" | "red";

/** Sipariş durumu etiketleri. */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Onay bekliyor", tone: "orange" },
  accepted: { label: "Kabul edildi", tone: "green" },
  preparing: { label: "Hazırlanıyor", tone: "orange" },
  ready: { label: "Servise hazır", tone: "green" },
  served: { label: "Teslim edildi", tone: "muted" },
  cancelled: { label: "İptal edildi", tone: "red" },
  rejected: { label: "Reddedildi", tone: "red" },
};

/** Ödeme durumu etiketleri. */
export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: "Ödenmedi", tone: "muted" },
  payment_requested: { label: "Hesap istendi", tone: "orange" },
  paid: { label: "Ödendi", tone: "green" },
  partially_paid: { label: "Kısmi ödendi", tone: "orange" },
  refunded: { label: "İade edildi", tone: "muted" },
};

/** Servis talebi türü etiketleri. */
export const SERVICE_REQUEST_META: Record<
  ServiceRequestType,
  { label: string; emoji: string }
> = {
  waiter: { label: "Garson çağır", emoji: "🙋" },
  bill: { label: "Hesap iste", emoji: "🧾" },
  water: { label: "Su iste", emoji: "💧" },
  cleaning: { label: "Masa temizliği", emoji: "🧽" },
  other: { label: "Diğer", emoji: "🔔" },
};

export const SERVICE_REQUEST_STATUS_META: Record<
  ServiceRequestStatus,
  { label: string; tone: Tone }
> = {
  pending: { label: "Bekliyor", tone: "orange" },
  acknowledged: { label: "Görüldü", tone: "green" },
  completed: { label: "Tamamlandı", tone: "muted" },
  cancelled: { label: "İptal", tone: "muted" },
};

/**
 * İzin verilen sipariş durum geçişleri (sunucu tarafında zorunlu).
 * SERVED/CANCELLED/REJECTED terminal — geri dönüş yok.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Bir durumdan reddetme/iptal neden ZORUNLU mu? */
export function reasonRequired(to: OrderStatus): boolean {
  return to === "rejected" || to === "cancelled";
}

export const TERMINAL_STATUSES: OrderStatus[] = ["served", "cancelled", "rejected"];
export const OPEN_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];
