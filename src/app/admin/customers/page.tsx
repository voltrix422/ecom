"use client";

import { useMemo, useState } from "react";
import { Banknote, ShoppingBag, Users } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";

function amount(value: number) {
  return value > 0 ? formatPrice(value) : "—";
}

export default function AdminCustomersPage() {
  const { customers } = useStore();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totals = useMemo(() => {
    const orders = customers.reduce((sum, customer) => sum + customer.orders, 0);
    const spent = customers.reduce((sum, customer) => sum + customer.spent, 0);
    return { orders, spent };
  }, [customers]);

  const stats = [
    {
      label: "Customers",
      value: String(customers.length),
      icon: Users,
    },
    {
      label: "Orders",
      value: String(totals.orders),
      icon: ShoppingBag,
    },
    {
      label: "Spent",
      value: formatPrice(totals.spent),
      icon: Banknote,
    },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden bg-muted/35 px-5 py-5"
          >
            <div className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-foreground/[0.03]" />
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {stat.label}
              </p>
              <stat.icon className="size-4 text-muted-foreground/70" />
            </div>
            <p className="mt-4 font-heading text-3xl tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "customer" : "customers"}
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="h-8 w-full max-w-[12rem] border-0 border-b border-foreground/15 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No customers match.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-muted-foreground">
                <th className="px-2 pb-2 font-medium">Name</th>
                <th className="px-2 pb-2 font-medium">Email</th>
                <th className="px-2 pb-2 text-right font-medium">Orders</th>
                <th className="px-2 pb-2 text-right font-medium">Spent</th>
                <th className="px-2 pb-2 text-right font-medium">Pending</th>
                <th className="px-2 pb-2 text-right font-medium">Paid</th>
                <th className="px-2 pb-2 text-right font-medium">Shipped</th>
                <th className="px-2 pb-2 text-right font-medium">Delivered</th>
                <th className="px-2 pb-2 text-right font-medium">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((customer) => (
                <tr
                  key={customer.id}
                  className="[&>td]:border-b [&>td]:border-foreground/10 last:[&>td]:border-b-0"
                >
                  <td className="px-2 py-2 whitespace-nowrap">{customer.name}</td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {customer.email}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {customer.orders}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                    {formatPrice(customer.spent)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {amount(customer.pending)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {amount(customer.paid)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {amount(customer.shipped)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {amount(customer.delivered)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {amount(customer.cancelled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
