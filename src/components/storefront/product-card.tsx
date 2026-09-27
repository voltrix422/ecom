import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { SalePrice } from "@/components/storefront/sale-price";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  badgeTone?: "bright" | "soft";
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="group flex min-w-0 flex-col overflow-hidden border border-black/12 bg-white"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f6f4f1]">
          <MediaImage
            src={product.image}
            alt={product.name}
            fill
            fit="cover"
            sizes="50vw"
            className="transition-opacity duration-300 group-hover:opacity-85"
          />
        </div>
        <div className="min-w-0 px-2 pt-2 pb-2.5">
          <p className="font-nav-display truncate text-[12px] leading-tight tracking-wide text-foreground uppercase sm:text-[14px]">
            {product.name}
          </p>
          <SalePrice
            price={product.price}
            className="mt-1 flex-col items-start gap-0 [&_span:first-child]:text-[10px] [&_span:last-child]:text-[13px] sm:[&_span:first-child]:text-[12px] sm:[&_span:last-child]:text-[15px]"
          />
          <p className="mt-0.5 truncate text-[10px] tracking-wide text-muted-foreground uppercase sm:text-[11px]">
            {product.category} · 3-piece
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-0">
      <div className="relative overflow-hidden">
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
