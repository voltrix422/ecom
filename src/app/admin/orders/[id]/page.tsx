"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Check, ChevronLeft, Copy, X } from "lucide-react";
import { OrderStatusSelect } from "@/app/admin/orders/status-select";
import { OrderTags } from "@/components/order-tags";
import { formatDate, formatPrice } from "@/lib/format";
import { refundTicketForOrder } from "@/lib/orders";
import { useStore } from "@/lib/store";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { orders, refundTickets, updateOrderStatus, canEdit } = useStore();
  const [copied, setCopied] = useState<"tracking" | "phone" | "address" | null>(
    null
  );
  const [proofOpen, setProofOpen] = useState(false);
  const order = orders.find((entry) => entry.id === id);
  const editable = canEdit();
  const refund = order
    ? refundTicketForOrder(refundTickets, order.id)
    : undefined;

  useEffect(() => {
    if (!proofOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setProofOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proofOpen]);

  if (!order) {
    return (
      <div className="max-w-md">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link
          href="/admin/orders"
          aria-label="Back"
          className="mt-4 inline-flex size-11 items-center justify-center"
        >
          <ChevronLeft className="size-8" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  const payment =
    order.paymentMethod === "bank"
      ? "Bank transfer"
      : order.paymentMethod === "cod"
        ? "COD"
        : null;

  const address = [
    order.customer.address,
    order.customer.city,
    order.customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  async function copyValue(
    value: string,
    field: "tracking" | "phone" | "address"
  ) {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/orders"
        aria-label="Back"
        className="-ml-2 inline-flex size-11 items-center justify-center"
      >
        <ChevronLeft className="size-8" strokeWidth={1.75} />
      </Link>

      <h2 className="font-heading text-2xl tracking-tight">{order.id}</h2>
      <div className="mt-0.5 flex items-start justify-between gap-6">
        <div>
          <button
            type="button"
            onClick={() => copyValue(order.trackingId, "tracking")}
            className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
            aria-label={`Copy ${order.trackingId}`}
          >
            {order.trackingId}
            {copied === "tracking" ? (
              <Check className="size-3.5" strokeWidth={2} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.75} />
            )}
          </button>
          <div className="mt-1">
            <OrderStatusSelect
              value={order.status}
              editable={editable}
              className="h-8 w-auto rounded-none border-0 bg-transparent px-0 shadow-none !border-0 focus-visible:border-0 focus-visible:ring-0"
              onChange={(status) => updateOrderStatus(order.id, status)}
            />
          </div>
          {refund ? (
            <div className="mt-1.5 flex items-center gap-2">
              <OrderTags hideStatus refund={refund.status} />
              <Link
                href={`/admin/refunds/${refund.id}`}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                {refund.id}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="bg-black px-2 py-1 text-right text-xs font-medium leading-5 text-white">
          <p>
            {order.customer.name}
            {` ${formatDate(order.createdAt)}`}
            {payment ? ` · ${payment}` : ""}
          </p>
          {order.customer.email ? (
            <p className="mt-0.5 break-all">{order.customer.email}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {order.customer.phone ? (
          <button
            type="button"
            onClick={() => copyValue(order.customer.phone, "phone")}
            className="inline-flex items-center gap-1.5 bg-yellow-400 px-2 py-0.5 text-xs font-medium text-black"
            aria-label={`Copy ${order.customer.phone}`}
          >
            {order.customer.phone}
            {copied === "phone" ? (
              <Check className="size-3.5" strokeWidth={2} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
        {address ? (
          <button
            type="button"
            onClick={() => copyValue(address, "address")}
            className="flex w-fit items-start gap-1.5 bg-blue-600 px-2 py-0.5 text-left text-xs font-medium text-white"
            aria-label="Copy address"
          >
            <span>{address}</span>
            {copied === "address" ? (
              <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
            ) : (
              <Copy className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.name}`}
            className="flex items-baseline gap-3 py-0.5 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
        <div className="mt-2 flex justify-end">
          <span className="inline-flex items-center gap-2 bg-red-600 px-4 py-1.5 text-lg font-bold text-white">
            Total
            <span>{formatPrice(order.total)}</span>
          </span>
        </div>
      </div>

      {order.notes ? (
        <p className="mt-4 text-sm text-muted-foreground">{order.notes}</p>
      ) : null}

      {order.paymentMethod === "bank" && order.paymentProof ? (
        <>
          <button
            type="button"
            onClick={() => setProofOpen(true)}
            className="mt-4 block text-left"
            aria-label="View payment screenshot"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.paymentProof}
              alt="Payment screenshot"
              className="max-h-36 w-auto object-contain object-left"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              View
            </span>
          </button>
          {proofOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setProofOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Payment screenshot"
            >
              <button
                type="button"
                onClick={() => setProofOpen(false)}
                className="absolute right-3 top-3 inline-flex size-10 items-center justify-center text-white"
                aria-label="Close"
              >
                <X className="size-6" strokeWidth={1.75} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.paymentProof}
                alt="Payment screenshot"
                className="max-h-[92vh] max-w-[92vw] object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
