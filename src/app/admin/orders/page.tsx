"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OrderStatusSelect } from "@/app/admin/orders/status-select";
import { OrderTags } from "@/components/order-tags";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, refundTicketForOrder } from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { cn } from "cn";

function localDay(iso: string) {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const {
    orders,
    refundTickets,
    updateOrderStatus,
    deleteOrder,
    deleteOrders,
    canEdit,
  } = useStore();
  const editable = canEdit();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kpisOpen, setKpisOpen] = useState(false);
  const [refundsOpen, setRefundsOpen] = useState(false);
  const [payment, setPayment] = useState<"all" | "cod" | "bank">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const scoped = useMemo(
    () =>
      orders.filter((order) => {
        const paymentOk =
          payment === "all" || order.paymentMethod === payment;
        const day = localDay(order.createdAt);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return paymentOk;
      }),
    [orders, payment, from, to]
  );

  const kpis = useMemo(
    () =>
      ORDER_STATUSES.map((item) => {
        const list = scoped.filter((order) => order.status === item);
        return {
          status: item,
          count: list.length,
          total: list.reduce((sum, order) => sum + order.total, 0),
        };
      }),
    [scoped]
  );

  const visible =
    status === "all"
      ? scoped
      : scoped.filter((order) => order.status === status);

  const visibleIds = useMemo(
    () => visible.map((order) => order.id),
    [visible]
  );
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.includes(id));

  const refundOrders = useMemo(
    () =>
      refundTickets
        .map((ticket) => ({
          ticket,
          order: orders.find((entry) => entry.id === ticket.orderId),
        }))
        .filter(
          (
            entry
          ): entry is {
            ticket: (typeof refundTickets)[number];
            order: (typeof orders)[number];
          } => Boolean(entry.order)
        ),
    [refundTickets, orders]
  );

  function resetFilters() {
    setPayment("all");
    setFrom("");
    setTo("");
    setStatus("all");
  }

  function toggleSelected(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter((id) => !visibleIds.includes(id))
      );
      return;
    }
    setSelected((current) => [...new Set([...current, ...visibleIds])]);
  }

  function confirmDelete(id: string, label: string) {
    if (!editable) return;
    const ok = window.confirm(
      `Delete order ${label}? This cannot be undone.`
    );
    if (!ok) return;
    deleteOrder(id);
    setSelected((current) => current.filter((item) => item !== id));
    toast.success(`Deleted ${label}`);
  }

  function confirmDeleteSelected() {
    if (!editable || !selected.length) return;
    const ok = window.confirm(
      selected.length === 1
        ? "Delete this order? This cannot be undone."
        : `Delete ${selected.length} orders? This cannot be undone.`
    );
    if (!ok) return;
    deleteOrders(selected);
    toast.success(
      selected.length === 1
        ? "Order deleted"
        : `${selected.length} orders deleted`
    );
    setSelected([]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "order" : "orders"}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {editable && visible.length > 0 ? (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={() => toggleSelectAllVisible()}
                  aria-label="Select all orders"
                />
                Select all
              </label>
              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={confirmDeleteSelected}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete selected ({selected.length})
                </button>
              ) : null}
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setRefundsOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Refunds
            {refundOrders.length ? (
              <span className="bg-foreground px-1.5 py-px text-[10px] tabular-nums text-background">
                {refundOrders.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setKpisOpen((open) => !open)}
            aria-expanded={kpisOpen}
            className="inline-flex cursor-pointer items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
          >
            KPI
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                kpisOpen && "rotate-180"
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-label="Filter"
            className="inline-flex cursor-pointer items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
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
      </div>

      <div className="relative mt-1 h-9 border-b border-foreground/10">
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end gap-3 overflow-x-auto text-sm whitespace-nowrap transition-opacity duration-200",
            filtersOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <button
            type="button"
            onClick={resetFilters}
            className={cn(
              "cursor-pointer",
              payment === "all" && !from && !to
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPayment("cod")}
            className={cn(
              "cursor-pointer",
              payment === "cod"
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
              payment === "bank"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bank transfer
          </button>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            From
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-7 w-[9.2rem] rounded-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            To
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-7 w-[9.2rem] rounded-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
          </label>
        </div>
      </div>

      {kpisOpen ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => {
            const active = status === kpi.status;
            return (
              <button
                key={kpi.status}
                type="button"
                onClick={() =>
                  setStatus((current) =>
                    current === kpi.status ? "all" : kpi.status
                  )
                }
                className={cn(
                  "group relative overflow-hidden bg-muted/35 px-5 py-5 text-left transition-colors hover:bg-muted/55",
                  active && "bg-muted/55"
                )}
              >
                <div className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-foreground/[0.03]" />
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  {kpi.status}
                </p>
                <p className="mt-4 font-heading text-3xl tracking-tight">
                  {formatPrice(kpi.total)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {kpi.count} {kpi.count === 1 ? "order" : "orders"}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No orders match.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-muted-foreground">
                {editable ? (
                  <th className="w-8 px-2 pb-2 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                ) : null}
                <th className="px-2 pb-2 font-medium">Order</th>
                <th className="px-2 pb-2 font-medium">Tracking</th>
                <th className="px-2 pb-2 font-medium">Customer</th>
                <th className="px-2 pb-2 font-medium">Items</th>
                <th className="px-2 pb-2 font-medium">Date</th>
                <th className="px-2 pb-2 font-medium">Payment</th>
                <th className="px-2 pb-2 font-medium">Status</th>
                <th className="px-2 pb-2 text-right font-medium">Total</th>
                {editable ? (
                  <th className="w-10 px-2 pb-2 font-medium">
                    <span className="sr-only">Delete</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/40 [&>td]:border-b [&>td]:border-foreground/10 last:[&>td]:border-b-0"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  {editable ? (
                    <td
                      className="px-2 py-1.5"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={selected.includes(order.id)}
                        onCheckedChange={() => toggleSelected(order.id)}
                        aria-label={`Select ${order.id}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-2 py-1.5 whitespace-nowrap">{order.id}</td>
                  <td className="px-2 py-1.5 font-mono text-xs whitespace-nowrap">
                    {order.trackingId}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {order.customer.name}
                    {order.customer.phone ? (
                      <span className="ml-2 text-muted-foreground">
                        {order.customer.phone}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[14rem] truncate px-2 py-1.5 text-muted-foreground">
                    {order.items
                      .map((item) => `${item.name} × ${item.quantity}`)
                      .join(", ")}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">
                    {order.paymentMethod === "bank"
                      ? "Bank transfer"
                      : order.paymentMethod === "cod"
                        ? "COD"
                        : "—"}
                  </td>
                  <td
                    className="px-2 py-1.5"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <OrderStatusSelect
                      value={order.status}
                      editable={editable}
                      className="h-7 w-auto rounded-none border-0 bg-transparent px-0 shadow-none ring-0 !border-0 focus-visible:border-0 focus-visible:ring-0"
                      onChange={(next) => updateOrderStatus(order.id, next)}
                    />
                    <OrderTags
                      hideStatus
                      refund={
                        refundTicketForOrder(refundTickets, order.id)?.status
                      }
                      className="mt-0.5"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    {formatPrice(order.total)}
                  </td>
                  {editable ? (
                    <td
                      className="px-2 py-1.5"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Delete ${order.id}`}
                        onClick={() =>
                          confirmDelete(order.id, order.trackingId || order.id)
                        }
                        className="p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={refundsOpen} onOpenChange={setRefundsOpen}>
        <DialogContent className="rounded-none sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund requests</DialogTitle>
            <DialogDescription>
              {refundOrders.length
                ? `${refundOrders.length} ${refundOrders.length === 1 ? "order" : "orders"} with a refund request.`
                : "No refund requests yet."}
            </DialogDescription>
          </DialogHeader>
          {refundOrders.length ? (
            <div className="max-h-[60vh] overflow-auto">
              {refundOrders.map(({ ticket, order }) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setRefundsOpen(false);
                    router.push(`/admin/refunds/${ticket.id}`);
                  }}
                  className="flex w-full items-start justify-between gap-4 border-b border-foreground/10 py-2.5 text-left text-sm last:border-b-0"
                >
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="font-mono">{order.trackingId}</span>
                    <span className="ml-2 text-muted-foreground">
                      {order.customer.name}
                    </span>
                    <OrderTags
                      status={order.status}
                      refund={ticket.status}
                      className="mt-1"
                    />
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatPrice(order.total)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
