"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/storefront/store-shell";
import { StoreReceipt } from "@/components/storefront/store-receipt";
import { Button } from "@/components/ui/button";
import { downloadOrderReceiptPdf } from "@/lib/receipt-pdf";
import { useStore } from "@/lib/store";
import type { Order } from "@/lib/types";
import { cn } from "cn";

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
  const [showReceipt, setShowReceipt] = useState(false);
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
    <StoreShell hideSaleBanner hideBottomNav>
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col px-5 pt-6 pb-10 sm:max-w-xl sm:pt-10">
        {!showReceipt ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="animate-order-placed select-none">
              <span
                className="mx-auto mb-5 inline-flex size-16 items-center justify-center rounded-full bg-foreground text-background animate-order-tick sm:size-[4.5rem]"
                aria-hidden
              >
                <Check className="size-8 sm:size-9" strokeWidth={2.5} />
              </span>
              <h1 className="font-nav-display text-[clamp(2.4rem,10vw,3.75rem)] leading-[0.92] tracking-tight text-foreground">
                Order placed
              </h1>
              {orderId ? (
                <p className="mt-3 text-[13px] text-muted-foreground tabular-nums">
                  {orderId}
                </p>
              ) : null}
            </div>

            <div className="mt-10 flex w-full max-w-xs flex-col gap-2.5 animate-order-actions">
              <Button
                type="button"
                className="font-nav-display h-12 w-full border-0 text-[14px] shadow-none"
                onClick={() => setShowReceipt(true)}
              >
                Done and receipt
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="font-nav-display h-11 w-full border-0 bg-black/6 text-[13px] shadow-none"
              >
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn("animate-page-fade flex flex-1 flex-col")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Back
              </button>
              <p className="font-nav-display text-[15px]">Receipt</p>
              <span className="w-10" aria-hidden />
            </div>
            <ReceiptView orderId={orderId} onDownload={onDownload} />
          </div>
        )}
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
