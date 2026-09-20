import type { Order, OrderStatus, RefundStatus, RefundTicket } from "@/lib/types";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Paid",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const TRACKING_STEPS: {
  status: Exclude<OrderStatus, "Cancelled">;
  label: string;
  detail: string;
}[] = [
  {
    status: "Pending",
    label: "Placed",
    detail: "We have your order.",
  },
  {
    status: "Paid",
    label: "Confirmed",
    detail: "Payment received. Preparing to ship.",
  },
  {
    status: "Shipped",
    label: "Shipped",
    detail: "Your parcel is on its way.",
  },
  {
    status: "Delivered",
    label: "Delivered",
    detail: "Arrived at the delivery address.",
  },
];

export function normalizeTrackingQuery(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Last 10 digits, so 0300…, +92 300…, and 92300… all match. */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function looksLikePhone(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

export function findOrderByTrackingId(orders: Order[], query: string) {
  const needle = normalizeTrackingQuery(query);
  if (!needle) return undefined;
  return orders.find((order) => {
    const tracking = normalizeTrackingQuery(order.trackingId);
    const id = normalizeTrackingQuery(order.id);
    return tracking === needle || id === needle;
  });
}

function phonesMatch(stored: string | undefined, needle: string) {
  if (!stored || needle.length < 10) return false;
  const phone = normalizePhone(stored);
  if (phone.length < 10) return false;
  return phone === needle;
}

export function findOrdersByQuery(orders: Order[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (looksLikePhone(trimmed)) {
    const needle = normalizePhone(trimmed);
    if (needle.length < 10) return [];
    return orders
      .filter((order) => phonesMatch(order.customer.phone, needle))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  const byId = findOrderByTrackingId(orders, trimmed);
  return byId ? [byId] : [];
}

export function isDeliveredStatus(status: string) {
  return status.trim().toLowerCase() === "delivered";
}

export function trackingStepIndex(status: OrderStatus) {
  if (status === "Cancelled") return -1;
  return TRACKING_STEPS.findIndex((step) => step.status === status);
}

export function refundLabel(status: RefundStatus) {
  if (status === "Pending") return "Refund requested";
  if (status === "Approved") return "Refund approved";
  if (status === "Rejected") return "Refund rejected";
  return "Refunded";
}

export function refundTicketForOrder(
  tickets: RefundTicket[],
  orderId: string
) {
  return tickets
    .filter((ticket) => ticket.orderId === orderId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
}
