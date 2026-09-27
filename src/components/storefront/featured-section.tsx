"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { Product } from "@/lib/types";

function FeaturedPanel({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col">
      <div className="relative min-h-[42svh] flex-1 bg-muted/15 lg:min-h-[52svh]">
        <SaleBadge tone="soft" />
        <MediaImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-5 md:p-8"
        />
      </div>

      <div className="flex flex-1 flex-col px-5 py-8 md:px-8 md:py-10">
        <p className="font-nav-display text-[12px] tracking-wide text-muted-foreground md:text-[13px]">
          {product.category} · {product.color}
        </p>
        <h3 className="font-nav-display mt-2 text-[26px] leading-[1.05] tracking-tight text-foreground md:text-[32px]">
          {product.name}
        </h3>
        <div className="mt-3">
          <SalePrice price={product.price} size="md" />
        </div>
        <p className="mt-4 line-clamp-3 text-[14px] leading-snug text-foreground/60 md:text-[15px]">
          {product.description}
        </p>
        <p className="mt-3 line-clamp-2 font-nav-display text-[11px] leading-snug tracking-wide text-foreground/40 md:text-[12px]">
          {product.details.join(" · ")}
        </p>
        <div className="mt-auto flex flex-wrap gap-2.5 pt-7">
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
}

export function FeaturedSection({ products }: { products: Product[] }) {
  const pairs = useMemo(() => {
    if (!products.length) return [] as Product[][];
    if (products.length === 1) return [[products[0], products[0]]];
    const chunks: Product[][] = [];
    for (let i = 0; i < products.length; i += 2) {
      const left = products[i];
      const right = products[i + 1] ?? products[0];
      chunks.push([left, right]);
    }
    return chunks;
  }, [products]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [pairs.length]);

  useEffect(() => {
    if (paused || pairs.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % pairs.length);
    }, 10000);
    return () => window.clearInterval(id);
  }, [pairs.length, paused]);

  if (!pairs.length) return null;

  const pair = pairs[index] ?? pairs[0];

  return (
    <section
      className="relative z-10 bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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

      <div
        key={`${pair[0].id}-${pair[1].id}-${index}`}
        className="featured-pair-fade border-y border-black/8"
      >
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="border-b border-black/8 lg:border-r lg:border-b-0">
            <FeaturedPanel product={pair[0]} />
          </div>
          <div>
            <FeaturedPanel product={pair[1]} />
          </div>
        </div>
      </div>

      {pairs.length > 1 ? (
        <div className="flex items-center justify-center gap-2 py-6">
          {pairs.map((entry, pairIndex) => (
            <button
              key={`${entry[0].id}-${entry[1].id}`}
              type="button"
              aria-label={`Show featured pair ${pairIndex + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                pairIndex === index
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
              )}
              onClick={() => setIndex(pairIndex)}
            />
          ))}
        </div>
      ) : (
        <div className="pb-10" />
      )}
    </section>
  );
}
