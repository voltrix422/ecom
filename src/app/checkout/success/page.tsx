"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/storefront/store-shell";
import { StoreReceipt } from "@/components/storefront/store-receipt";
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
        <div className="relative flex min-h-[240px] items-center lg:min-h-[380px]">
          <div className="select-none animate-order-cart">
            <div className="flex items-end gap-3 sm:gap-4">
              <span
                className="mb-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background animate-cart-wiggle sm:mb-2 sm:size-12"
                aria-hidden
              >
                <Check className="size-5 sm:size-6" strokeWidth={2.5} />
              </span>
              <h1 className="text-[clamp(2.6rem,9vw,5rem)] leading-[0.9] tracking-tight text-foreground">
                Order placed
              </h1>
            </div>
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
