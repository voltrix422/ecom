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
        "inline-flex items-baseline gap-2.5 font-nav-display",
        className
      )}
    >
      <span
        className={cn(
          "text-foreground/30 line-through",
          size === "md" ? "text-[15px]" : "text-[13px]"
        )}
      >
        {formatPrice(price)}
      </span>
      <span
        className={cn(
          "font-bold text-foreground/85",
          size === "md" ? "text-[20px]" : "text-[16px]"
        )}
      >
        {formatPrice(salePrice(price))}
      </span>
    </span>
  );
}
