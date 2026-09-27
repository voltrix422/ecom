"use client";

import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { Product } from "@/lib/types";

export function FeaturedSection({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="relative z-10 bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-16 md:pt-20">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
          <div>
            <p className="font-nav-display text-[15px] tracking-wide text-muted-foreground md:text-[17px]">
              Selected
            </p>
            <h2 className="font-nav-display mt-2 text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              Featured suits
            </h2>
          </div>
          <Link
            href="/shop"
            className="font-nav-display shrink-0 pb-1 text-[18px] text-muted-foreground transition-colors hover:text-foreground md:text-[20px]"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="divide-y divide-black/8 border-y border-black/8">
        {products.map((product, index) => {
          const imageRight = index % 2 === 1;
          return (
            <article
              key={product.id}
              className="mx-auto grid max-w-7xl items-center lg:grid-cols-2"
            >
              <div
                className={cn(
                  "relative min-h-[52svh] bg-muted/15 lg:min-h-[68svh]",
                  imageRight && "lg:order-2"
                )}
              >
                <SaleBadge tone="soft" />
                <MediaImage
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain p-6 md:p-10"
                />
              </div>

              <div
                className={cn(
                  "flex flex-col justify-center px-6 py-12 md:px-10 md:py-16 lg:px-14",
                  imageRight && "lg:order-1"
                )}
              >
                <p className="font-nav-display text-[13px] tracking-wide text-muted-foreground">
                  {product.category} · {product.color}
                </p>
                <h3 className="font-nav-display mt-3 text-[32px] leading-[1.05] tracking-tight text-foreground md:text-[40px]">
                  {product.name}
                </h3>
                <div className="mt-4">
                  <SalePrice price={product.price} size="md" />
                </div>
                <p className="mt-5 max-w-md text-[15px] leading-snug text-foreground/60 md:text-[16px]">
                  {product.description}
                </p>
                <p className="mt-4 max-w-md font-nav-display text-[12px] leading-snug tracking-wide text-foreground/40">
                  {product.details.join(" · ")}
                </p>
                <div className="mt-8 flex flex-wrap gap-2.5">
                  <Button asChild className="h-11 border-0 shadow-none">
                    <Link href={`/product/${product.slug}`}>
                      <span>View suit</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 border-0 bg-black/8 shadow-none"
                  >
                    <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
                      <span>Shop {product.category}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
