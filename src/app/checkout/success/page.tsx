"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Download, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/storefront/store-shell";
import { BrandArcLogo } from "@/components/brand-arc-logo";
import { brand } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { downloadOrderReceiptPdf } from "@/lib/receipt-pdf";
import { useStore } from "@/lib/store";
import type { Order } from "@/lib/types";

function ReceiptView({
  orderId,
  onDownload,
}: {
  orderId: string | null;
  onDownload: () => void;
}) {
  const { orders, bankDetails } = useStore();
  const [fetched, setFetched] = useState<Order | null>(null);
  const order =
    orders.find((entry) => entry.id === orderId) ?? fetched ?? undefined;

  useEffect(() => {
    if (!orderId || orders.some((entry) => entry.id === orderId)) return;
    let cancelled = false;
    (async () => {
      const response = await fetch(
        `/api/orders/lookup?q=${encodeURIComponent(orderId)}`
      );
      const data = (await response.json().catch(() => null)) as {
        mode?: string;
        orders?: Order[];
      } | null;
      if (cancelled || !data || data.mode === "local") return;
      setFetched(data.orders?.find((entry) => entry.id === orderId) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, orders]);

  if (!order) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Receipt unavailable. Your order may still have been placed.
      </div>
    );
  }

  const subtotal = order.total - (order.shipping || 0);

  return (
    <div className="relative mx-auto w-full max-w-[280px] px-1 py-2 font-mono text-[12px] leading-relaxed">
      <button
        type="button"
        onClick={onDownload}
        aria-label="Download receipt PDF"
        title="Download PDF"
        className="absolute top-2 right-0 z-10 inline-flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Download className="size-3.5" />
      </button>

      <div className="text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <BrandArcLogo size={112} href={null} />
        </div>
        <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
          <p>
            <span className="text-muted-foreground/80">Order</span>{" "}
            <span className="text-foreground">{order.id}</span>
          </p>
          <p>
            <span className="text-muted-foreground/80">Tracking ID</span>{" "}
            <span className="text-foreground">{order.trackingId}</span>
          </p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="my-3 border-t border-dashed border-foreground/20" />

      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        <p className="text-foreground">{order.customer.name}</p>
        {order.customer.phone ? <p>{order.customer.phone}</p> : null}
        <p className="break-all">{order.customer.email}</p>
        <p>
          {order.customer.address}, {order.customer.city}
        </p>
        <p>{order.customer.country}</p>
      </div>

      <div className="my-3 border-t border-dashed border-foreground/20" />

      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.name}`}
            className="flex justify-between gap-2"
          >
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-dashed border-foreground/20" />

      <div className="space-y-1">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Shipping</span>
          <span className="tabular-nums">
            {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Payment</span>
          <span>
            {order.paymentMethod === "bank" ? "Bank" : "COD"}
          </span>
        </div>
      </div>

      <div className="my-3 border-t border-foreground/35" />

      <div className="flex justify-between gap-2 text-[13px]">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(order.total)}</span>
      </div>

      {order.notes ? (
        <>
          <div className="my-3 border-t border-dashed border-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Note: {order.notes}</p>
        </>
      ) : null}

      {order.paymentMethod === "bank" ? (
        <>
          <div className="my-3 border-t border-dashed border-foreground/20" />
          <div className="space-y-0.5 text-[11px]">
            <p className="text-muted-foreground">Bank transfer</p>
            <p>{bankDetails.bankName}</p>
            <p>{bankDetails.accountTitle}</p>
            <p className="break-all tracking-wide">{bankDetails.iban}</p>
          </div>
        </>
      ) : null}

      {order.paymentProof ? (
        <>
          <div className="my-3 border-t border-dashed border-foreground/20" />
          <p className="mb-2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Payment proof
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.paymentProof}
            alt="Payment proof"
            className="max-h-48 w-full object-contain"
          />
        </>
      ) : null}

      <p className="mt-5 text-center text-[10px] text-muted-foreground">
        Thank you
      </p>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { orders, bankDetails } = useStore();
  const [fetched, setFetched] = useState<Order | null>(null);
  const order =
    orders.find((entry) => entry.id === orderId) ?? fetched ?? undefined;

  useEffect(() => {
    if (!orderId || orders.some((entry) => entry.id === orderId)) return;
    let cancelled = false;
    (async () => {
      const response = await fetch(
        `/api/orders/lookup?q=${encodeURIComponent(orderId)}`
      );
      const data = (await response.json().catch(() => null)) as {
        mode?: string;
        orders?: Order[];
      } | null;
      if (cancelled || !data || data.mode === "local") return;
      setFetched(data.orders?.find((entry) => entry.id === orderId) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, orders]);

  async function onDownload() {
    if (!order) {
      toast.error("Receipt not found");
      return;
    }
    try {
      await downloadOrderReceiptPdf(order, bankDetails);
      toast.success("Receipt PDF downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not download receipt"
      );
    }
  }

  return (
    <StoreShell hideSaleBanner>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-start">
        <div className="relative flex min-h-[280px] items-center lg:min-h-[420px]">
          <div className="select-none animate-order-cart">
            <div className="flex items-end gap-3">
              <ShoppingCart
                className="mb-2 size-8 shrink-0 text-foreground animate-cart-wiggle sm:size-10"
                strokeWidth={1.5}
                aria-hidden
              />
              <h1 className="font-heading text-[clamp(2.6rem,9vw,5rem)] leading-[0.9] tracking-tight text-foreground">
                Order placed
              </h1>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Thank you for shopping with {brand.name}
            </p>
            {order?.trackingId ? (
              <Link
                href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                className="mt-6 inline-block text-sm text-foreground underline-offset-4 hover:underline"
              >
                Track this order
              </Link>
            ) : null}
          </div>
        </div>

        <div>
          <ReceiptView orderId={orderId} onDownload={onDownload} />
        </div>
      </div>
    </StoreShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
