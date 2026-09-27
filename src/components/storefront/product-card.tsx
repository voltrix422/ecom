import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { formatPrice } from "@/lib/format";
import { storePath } from "@/lib/site-mode";
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
        href={storePath(`/product/${product.slug}`)}
        className="group flex min-w-0 flex-col bg-white"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-white">
          <MediaImage
            src={product.image}
            alt={product.name}
            fill
            fit="contain"
            sizes="50vw"
            className="transition-opacity duration-300 group-hover:opacity-85"
          />
        </div>
        <div className="min-w-0 pt-1.5">
          <p className="font-nav-display truncate text-[12px] leading-none tracking-wide text-foreground uppercase sm:text-[14px]">
            {product.name}
          </p>
          <div className="mt-1 flex min-w-0 items-baseline justify-between gap-2">
            <p className="font-nav-display shrink-0 text-[15px] font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-[17px]">
              {formatPrice(product.price)}
            </p>
            <span className="truncate text-[9px] font-medium tracking-[0.12em] text-foreground/45 uppercase sm:text-[10px]">
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={storePath(`/product/${product.slug}`)} className="group block min-w-0">
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
        <div className="mt-1.5 flex min-w-0 items-baseline justify-between gap-3">
          <p className="font-nav-display shrink-0 text-[18px] font-semibold tracking-tight text-foreground tabular-nums">
            {formatPrice(product.price)}
          </p>
          <span className="truncate text-[11px] tracking-[0.12em] text-foreground/45 uppercase">
            {product.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
