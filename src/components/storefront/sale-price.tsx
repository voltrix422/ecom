import { formatPrice } from "@/lib/format";
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
        "inline-flex items-baseline font-nav-display font-semibold tracking-tight text-foreground/90",
        size === "md" ? "text-[22px]" : "text-[16px]",
        className
      )}
    >
      {formatPrice(price)}
    </span>
  );
}
