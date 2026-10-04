"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MediaImage } from "@/components/media-image";
import { formatPrice } from "@/lib/format";
import { storePath } from "@/lib/site-mode";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/5]",
  "aspect-[5/6]",
  "aspect-[2/3]",
] as const;

export function HomePinGrid() {
  const { products, ready } = useStore();

  const pins = useMemo(
    () =>
      products.map((product, index) => ({
        key: product.id,
        href: storePath(`/product/${product.slug}`),
        src: product.image,
        title: product.name,
        price: product.price,
        aspect: ASPECTS[index % ASPECTS.length],
      })),
    [products]
  );

  if (!ready && pins.length === 0) {
    return (
      <div className="columns-2 gap-3 px-3 pt-2 pb-24 md:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "mb-3 break-inside-avoid rounded-2xl bg-black/5",
              ASPECTS[index % ASPECTS.length]
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="md:hidden" aria-label="Shop">
      <div className="columns-2 gap-3 px-3 pt-2 pb-28">
        {pins.map((pin, index) => (
          <Link
            key={pin.key}
            href={pin.href}
            className="mb-3 block break-inside-avoid"
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl bg-[#efeae4]",
                pin.aspect
              )}
            >
              <MediaImage
                src={pin.src}
                alt={pin.title}
                fill
                fit="cover"
                priority={index < 4}
                sizes="50vw"
              />
            </div>
            <div className="mt-2 min-w-0 px-0.5">
              <p className="font-nav-display truncate text-[13px] leading-snug tracking-tight text-foreground">
                {pin.title}
              </p>
              <p className="font-nav-display mt-0.5 text-[15px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {formatPrice(pin.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
