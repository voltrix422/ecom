"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AdminRefundsPage() {
  const router = useRouter();
  const { refundTickets, orders } = useStore();

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {refundTickets.length}{" "}
        {refundTickets.length === 1 ? "ticket" : "tickets"}
      </p>

      {refundTickets.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No refund tickets.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-muted-foreground">
                <th className="px-2 pb-2 font-medium">Ticket</th>
                <th className="px-2 pb-2 font-medium">Order</th>
                <th className="px-2 pb-2 font-medium">Customer</th>
                <th className="px-2 pb-2 font-medium">Date</th>
                <th className="px-2 pb-2 font-medium">Status</th>
                <th className="px-2 pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {refundTickets.map((ticket) => {
                const order = orders.find((entry) => entry.id === ticket.orderId);
                return (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/40 [&>td]:border-b [&>td]:border-foreground/10 last:[&>td]:border-b-0"
                    onClick={() => router.push(`/admin/refunds/${ticket.id}`)}
                  >
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                      {ticket.id}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs whitespace-nowrap">
                      {ticket.trackingId}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {ticket.customerName}
                      {ticket.customerPhone ? (
                        <span className="ml-2 text-muted-foreground">
                          {ticket.customerPhone}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-2 py-1.5">{ticket.status}</td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      {order ? formatPrice(order.total) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
