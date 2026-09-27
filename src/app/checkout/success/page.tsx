"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { StoreShell } from "@/components/storefront/store-shell";
import { StoreReceipt } from "@/components/storefront/store-receipt";
import { brand } from "@/lib/data";
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

  return (
    <StoreReceipt
      lines={order.items.map((item) => ({
        key: `${item.productId}-${item.name}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))}
      shipping={order.shipping || 0}
      total={order.total}
      payment={order.paymentMethod ?? "cod"}
      customer={order.customer}
      notes={order.notes}
      bankDetails={
        order.paymentMethod === "bank" ? bankDetails : undefined
      }
      paymentProof={order.paymentProof}
      orderId={order.id}
      trackingId={order.trackingId}
      createdAt={order.createdAt}
      onDownload={onDownload}
    />
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
      <div className="font-nav-display relative mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_340px] lg:items-center lg:gap-16 lg:py-20">
        <div className="relative flex min-h-[240px] flex-col justify-center lg:min-h-[380px]">
          <p className="text-[12px] tracking-[0.18em] text-muted-foreground uppercase">
            Confirmation
          </p>
          <h1 className="mt-4 max-w-[12ch] text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.92] tracking-tight text-foreground">
            Order placed
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Thank you for shopping with {brand.name}. A confirmation is on its
            way — keep your tracking ID handy.
          </p>

          {order?.trackingId ? (
            <div className="mt-8 max-w-sm border-t border-black/10 pt-6">
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Tracking ID
              </p>
              <p className="mt-2 font-mono text-[15px] tracking-wide text-foreground">
                {order.trackingId}
              </p>
              <Link
                href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                className="mt-5 inline-flex items-center text-[13px] tracking-wide text-foreground underline-offset-4 transition-opacity hover:underline"
              >
                Track this order
              </Link>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[13px]">
            <Link
              href="/shop"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Continue shopping
            </Link>
            <Link
              href="/"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Back home
            </Link>
          </div>
        </div>

        <div className="lg:border-l lg:border-black/8 lg:pl-12">
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
