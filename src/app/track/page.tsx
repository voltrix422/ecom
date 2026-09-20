"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { OrderTags } from "@/components/order-tags";
import { StoreShell } from "@/components/storefront/store-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  TRACKING_STEPS,
  findOrdersByQuery,
  looksLikePhone,
  normalizeTrackingQuery,
  refundTicketForOrder,
  trackingStepIndex,
} from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { Order, RefundTicket } from "@/lib/types";
import { cn } from "cn";

function trackHref(query: string, status?: string, payment?: string) {
  const trimmed = query.trim();
  if (!trimmed) return "/track";
  const key = looksLikePhone(trimmed) ? "q" : "id";
  const value = looksLikePhone(trimmed)
    ? trimmed.replace(/\s+/g, "")
    : normalizeTrackingQuery(trimmed);
  const params = new URLSearchParams();
  params.set(key, value);
  if (status && status !== "all") params.set("status", status);
  if (payment && payment !== "all") params.set("payment", payment);
  return `/track?${params.toString()}`;
}

function IosBack({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const icon = (
    <ChevronLeft className="size-8" strokeWidth={1.75} aria-hidden />
  );
  const className =
    "-ml-2 inline-flex size-11 items-center justify-center text-foreground";

  if (href) {
    return (
      <Link href={href} aria-label="Back" className={className}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className={cn(className, "cursor-pointer")}
    >
      {icon}
    </button>
  );
}

function StatusTimeline({ order }: { order: Order }) {
  const currentIndex = trackingStepIndex(order.status);

  if (order.status === "Cancelled") {
    return (
      <div className="mt-10 text-center">
        <p className="font-heading text-2xl tracking-tight">Cancelled</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This order is no longer being fulfilled.
        </p>
      </div>
    );
  }

  const progress =
    currentIndex <= 0 ? 0 : currentIndex / (TRACKING_STEPS.length - 1);

  return (
    <div className="mt-12">
      <div className="relative px-4">
        <div className="absolute top-[5px] right-[16.5%] left-[16.5%] h-px bg-foreground/15" />
        <div
          className="absolute top-[5px] left-[16.5%] h-px bg-foreground"
          style={{ width: `calc(${progress} * (100% - 33%))` }}
        />
        <ol className="relative grid grid-cols-4">
          {TRACKING_STEPS.map((step, index) => {
            const done = currentIndex >= index;
            const current = currentIndex === index;
            return (
              <li key={step.status} className="flex flex-col items-center">
                <span
                  className={cn(
                    "size-2.5 rounded-full ring-4 ring-background",
                    done ? "bg-foreground" : "bg-foreground/20"
                  )}
                />
                <p
                  className={cn(
                    "mt-3 text-[11px] tracking-[0.08em] uppercase",
                    current
                      ? "text-foreground"
                      : done
                        ? "text-foreground/70"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
      {currentIndex >= 0 ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {TRACKING_STEPS[currentIndex].detail}
        </p>
      ) : null}
    </div>
  );
}

function OrderResult({
  order,
  refund,
  backHref,
  onBack,
}: {
  order: Order;
  refund?: RefundTicket;
  backHref?: string;
  onBack?: () => void;
}) {
  const payment =
    order.paymentMethod === "bank"
      ? "Bank transfer"
      : order.paymentMethod === "cod"
        ? "Cash on delivery"
        : null;

  return (
    <div className="relative mx-auto mt-14 max-w-md">
      <div className="absolute -top-1 left-0">
        <IosBack href={backHref} onClick={onBack} />
      </div>

      <div className="text-center">
        <p className="font-heading text-3xl tracking-tight">
          {order.trackingId}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(order.createdAt)}
          {payment ? ` · ${payment}` : ""}
        </p>
        <div className="mt-3 flex justify-center">
          <OrderTags status={order.status} refund={refund?.status} />
        </div>
      </div>

      <StatusTimeline order={order} />

      <div className="mt-12">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.name}`}
            className="flex items-baseline justify-between gap-6 py-2 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
        <p className="mt-8 text-center text-sm leading-6 text-muted-foreground">
          {[
            order.customer.address,
            order.customer.city,
            order.customer.country,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>

        {order.paymentMethod === "bank" && order.paymentProof ? (
          <div className="mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.paymentProof}
              alt="Payment screenshot"
              className="mx-auto max-h-[380px] w-full object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TrackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, refundTickets, ready } = useStore();
  const phoneQuery = searchParams.get("q") ?? "";
  const selectedId = searchParams.get("id") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";
  const paymentFilter = searchParams.get("payment") ?? "all";
  const lookup = phoneQuery || selectedId;
  const [query, setQuery] = useState(lookup);
  const [submitted, setSubmitted] = useState(lookup);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const next = searchParams.get("q") ?? searchParams.get("id") ?? "";
    setQuery(next);
    setSubmitted(next);
  }, [searchParams]);

  const matches = useMemo(
    () => (submitted ? findOrdersByQuery(orders, submitted) : []),
    [orders, submitted]
  );
  const visible = useMemo(
    () =>
      matches.filter((order) => {
        const statusOk =
          statusFilter === "all" || order.status === statusFilter;
        const paymentOk =
          paymentFilter === "all" || order.paymentMethod === paymentFilter;
        return statusOk && paymentOk;
      }),
    [matches, statusFilter, paymentFilter]
  );
  const selected = selectedId
    ? findOrdersByQuery(orders, selectedId)[0]
    : visible.length === 1
      ? visible[0]
      : undefined;
  const listHref =
    phoneQuery && matches.length > 1
      ? trackHref(phoneQuery, statusFilter, paymentFilter)
      : undefined;
  const showList = matches.length > 1 && !selectedId;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    setSubmitted(next);
    setFiltersOpen(false);
    router.replace(trackHref(next));
  }

  function setStatus(next: string) {
    const source = phoneQuery || submitted;
    router.replace(trackHref(source, next, paymentFilter));
  }

  function setPayment(next: string) {
    const source = phoneQuery || submitted;
    const payment = paymentFilter === next ? "all" : next;
    router.replace(trackHref(source, statusFilter, payment));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1
          className={cn(
            "font-heading leading-tight tracking-tight",
            selected
              ? "text-2xl md:text-3xl"
              : "text-4xl md:text-6xl"
          )}
        >
          Track your order.
        </h1>
        <form
          onSubmit={onSubmit}
          className={cn(
            "mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-center",
            selected ? "mt-6" : "mt-10"
          )}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tracking ID or phone"
            aria-label="Tracking ID or phone number"
            autoComplete="tel"
            spellCheck={false}
            className="h-10 rounded-none text-center font-mono text-sm sm:text-left"
          />
          <Button type="submit" size="lg" className="rounded-none sm:h-10">
            Track
          </Button>
        </form>
      </div>

      {submitted && ready && matches.length === 0 ? (
        <p className="mt-14 text-center text-sm text-muted-foreground">
          No order found.
        </p>
      ) : null}

      {matches.length > 1 && showList ? (
        <div className="mt-16">
          <div className="border-b border-foreground/15 px-3 pb-3">
          <div className="relative flex items-center">
            <p className="text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "order" : "orders"}
            </p>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-label="Filter"
              className="absolute right-0 inline-flex cursor-pointer items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Filter
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  filtersOpen && "rotate-180"
                )}
              />
            </button>
          </div>

          <div className="relative mt-1 h-7">
            <div
              className={cn(
                "absolute inset-y-0 right-0 flex items-center justify-end gap-2.5 overflow-x-auto text-sm whitespace-nowrap transition-opacity duration-200",
                filtersOpen
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  const source = phoneQuery || submitted;
                  router.replace(trackHref(source, "all", "all"));
                }}
                className={cn(
                  "cursor-pointer",
                  statusFilter === "all" && paymentFilter === "all"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(status)}
                  className={cn(
                    "cursor-pointer",
                    statusFilter === status
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPayment("cod")}
                className={cn(
                  "cursor-pointer",
                  paymentFilter === "cod"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                COD
              </button>
              <button
                type="button"
                onClick={() => setPayment("bank")}
                className={cn(
                  "cursor-pointer",
                  paymentFilter === "bank"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bank transfer
              </button>
            </div>
          </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No orders match.
            </p>
          ) : (
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-3 pb-3 font-medium">Tracking</th>
                    <th className="px-3 pb-3 font-medium">Items</th>
                    <th className="px-3 pb-3 font-medium">Status</th>
                    <th className="px-3 pb-3 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() =>
                        router.push(
                          `/track?q=${encodeURIComponent(phoneQuery || submitted)}&id=${encodeURIComponent(order.trackingId)}`
                        )
                      }
                    >
                      <td className="px-3 py-3 font-mono whitespace-nowrap">
                        {order.trackingId}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {order.items.map((item) => item.name).join(", ")}
                      </td>
                      <td className="px-3 py-3">
                        <OrderTags
                          status={order.status}
                          refund={
                            refundTicketForOrder(refundTickets, order.id)
                              ?.status
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {selected ? (
        <OrderResult
          order={selected}
          refund={refundTicketForOrder(refundTickets, selected.id)}
          backHref={listHref}
          onBack={listHref ? undefined : () => router.back()}
        />
      ) : null}
    </div>
  );
}

export default function TrackPage() {
  return (
    <StoreShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-16 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <TrackForm />
      </Suspense>
    </StoreShell>
  );
}
