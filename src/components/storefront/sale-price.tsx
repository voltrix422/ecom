import { formatPrice, salePrice } from "@/lib/format";
import { cn } from "cn";

export function SalePrice({
  price,
  className,
  size = "sm",
}: {
  price: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2.5",
        size === "md" ? "tracking-[0.12em]" : "",
        className
      )}
    >
      <span className="text-sm text-foreground/30 line-through">
        {formatPrice(price)}
      </span>
      <span className="text-base font-bold text-foreground/80">
        {formatPrice(salePrice(price))}
      </span>
    </span>
  );
}
