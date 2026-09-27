import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  badgeTone = "bright",
}: {
  product: Product;
  badgeTone?: "bright" | "soft";
}) {
  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-0">
      <div className="relative overflow-hidden">
        <SaleBadge tone={badgeTone} />
        <MediaImage
          src={product.image}
          alt={product.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 50vw"
          className="transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <div className="mt-3 min-w-0">
        <p className="font-nav-display truncate text-[14px] leading-tight text-foreground sm:text-[16px]">
          {product.name}
        </p>
        <SalePrice
          price={product.price}
          className="mt-1.5 flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-2 [&_span:first-child]:text-[11px] sm:[&_span:first-child]:text-[13px] [&_span:last-child]:text-[15px] sm:[&_span:last-child]:text-[16px]"
        />
        <p className="mt-1 font-nav-display truncate text-[11px] text-muted-foreground sm:text-[12px]">
          {product.category} · 3-piece
        </p>
      </div>
    </Link>
  );
}
