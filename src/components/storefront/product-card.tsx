import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  badgeTone = "bright",
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
          <SaleBadge tone={badgeTone} compact />
          <MediaImage
            src={product.image}
            alt={product.name}
            fill
            fit="cover"
            sizes="33vw"
            className="transition-opacity duration-300 group-hover:opacity-85"
          />
        </div>
        <div className="min-w-0 px-1.5 pt-1.5 pb-2">
          <p className="font-nav-display truncate text-[10px] leading-tight tracking-wide text-foreground uppercase sm:text-[12px]">
            {product.name}
          </p>
          <SalePrice
            price={product.price}
            className="mt-1 flex-col items-start gap-0 [&_span:first-child]:text-[9px] [&_span:last-child]:text-[11px] sm:[&_span:first-child]:text-[11px] sm:[&_span:last-child]:text-[13px]"
          />
          <p className="mt-0.5 truncate text-[9px] tracking-wide text-muted-foreground uppercase sm:text-[10px]">
            {product.category} · 3-piece
          </p>
        </div>
      </Link>
    );
  }

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
