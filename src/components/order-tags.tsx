import { refundLabel } from "@/lib/orders";
import type { OrderStatus, RefundStatus } from "@/lib/types";
import { cn } from "cn";

export function OrderTags({
  status,
  refund,
  hideStatus = false,
  className,
}: {
  status?: OrderStatus;
  refund?: RefundStatus;
  hideStatus?: boolean;
  className?: string;
}) {
  if ((hideStatus || !status) && !refund) return null;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {!hideStatus && status ? (
        <span className="bg-muted px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {status}
        </span>
      ) : null}
      {refund ? (
        <span
          className={cn(
            "px-1.5 py-0.5 text-[10px] tracking-[0.12em] uppercase",
            refund === "Rejected"
              ? "bg-muted text-muted-foreground"
              : "bg-foreground text-background"
          )}
        >
          {refundLabel(refund)}
        </span>
      ) : null}
    </span>
  );
}
