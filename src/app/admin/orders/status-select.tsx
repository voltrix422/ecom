"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusSelect({
  value,
  onChange,
  editable,
  className,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  editable: boolean;
  className?: string;
}) {
  if (!editable) {
    return <Badge variant="outline">{value}</Badge>;
  }

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as OrderStatus)}
    >
      <SelectTrigger className={className ?? "w-36 rounded-none"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
