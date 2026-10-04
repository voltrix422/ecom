"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { cn } from "cn";
import { storePath } from "@/lib/site-mode";
import type { Product } from "@/lib/types";

function FeaturedPanel({ product }: { product: Product }) {
  return (
    <Link
      href={storePath(`/product/${product.id}`)}
      className="group relative block min-h-[78svh] overflow-hidden bg-muted/10 lg:min-h-[90svh]"
    >
      <MediaImage
        src={product.image}
        alt={product.name}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-contain p-1 transition-transform duration-700 group-hover:scale-[1.02] md:p-2"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent px-6 pb-8 pt-20 md:px-8 md:pb-10">
        <p className="font-nav-display text-[22px] tracking-tight text-foreground md:text-[28px]">
          {product.name}
        </p>
      </div>
    </Link>
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
      <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-16">
        <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
          <h2 className="font-nav-display text-3xl leading-[0.95] tracking-tight md:text-4xl lg:text-[2.75rem]">
            Featured suits
          </h2>
          <Link
            href={storePath("/shop")}
            className="font-nav-display shrink-0 pb-1 text-[16px] text-muted-foreground transition-colors hover:text-foreground md:text-[18px]"
          >
            View all
          </Link>
        </div>
      </div>

      <div
        key={`${pair[0].id}-${pair[1].id}-${index}`}
        className="featured-pair-fade"
      >
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <FeaturedPanel product={pair[0]} />
          <FeaturedPanel product={pair[1]} />
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
