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
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative">
        <SaleBadge tone={badgeTone} />
        <MediaImage
          src={product.image}
          alt={product.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="font-nav-display text-[15px] text-foreground sm:text-[16px]">
            {product.name}
          </p>
          <p className="mt-1.5 font-nav-display text-[11px] text-muted-foreground sm:text-[12px]">
            {product.category} · 3-piece
          </p>
        </div>
        <SalePrice price={product.price} />
      </div>
    </Link>
  );
}
