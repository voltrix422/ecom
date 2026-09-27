"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MediaImage } from "@/components/media-image";
import { usableCollectionSlides } from "@/lib/collection-slides";
import { usableHeroBanners } from "@/lib/hero-storage";
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

type Pin = {
  key: string;
  href: string;
  src: string;
  title: string;
  aspect: (typeof ASPECTS)[number];
};

export function HomePinGrid() {
  const { products, heroBanners, collectionSlides, ready } = useStore();

  const pins = useMemo(() => {
    const list: Pin[] = [];

    products.forEach((product, index) => {
      list.push({
        key: `p-${product.id}`,
        href: `/product/${product.slug}`,
        src: product.image,
        title: product.name,
        aspect: ASPECTS[index % ASPECTS.length],
      });
      if (product.fabric) {
        list.push({
          key: `f-${product.id}`,
          href: `/product/${product.slug}`,
          src: product.fabric,
          title: `${product.name} fabric`,
          aspect: ASPECTS[(index + 2) % ASPECTS.length],
        });
      }
    });

    usableHeroBanners(heroBanners).forEach((banner, index) => {
      list.push({
        key: `h-${banner.id}`,
        href: "/shop",
        src: banner.src,
        title: "Look",
        aspect: ASPECTS[(index + 1) % ASPECTS.length],
      });
    });

    usableCollectionSlides(collectionSlides).forEach((slide, index) => {
      list.push({
        key: `c-${slide.id}`,
        href: slide.href || "/shop",
        src: slide.src,
        title: slide.caption || "Collection",
        aspect: ASPECTS[(index + 3) % ASPECTS.length],
      });
    });

    return list;
  }, [products, heroBanners, collectionSlides]);

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
    <section className="md:hidden" aria-label="Discover">
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
                className="transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-2 truncate px-0.5 text-[12px] leading-snug text-foreground">
              {pin.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
