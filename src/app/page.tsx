"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FeaturedCarousel } from "@/components/storefront/featured-carousel";
import MorphSlider from "@/components/storefront/morph-slider";
import { HeroSection } from "@/components/storefront/hero-section";
import { StoreShell } from "@/components/storefront/store-shell";
import {
  DEFAULT_COLLECTION_SLIDES,
  usableCollectionSlides,
} from "@/lib/collection-slides";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { products, collectionSlides } = useStore();
  const featured = useMemo(
    () => products.filter((product) => product.featured),
    [products]
  );
  const carouselItems = useMemo(
    () =>
      featured.map((product) => ({
        src: product.image,
        alt: product.name,
        title: product.name,
        subtitle: product.category,
        href: `/product/${product.slug}`,
      })),
    [featured]
  );

  const morphItems = useMemo(() => {
    const slides = usableCollectionSlides(
      collectionSlides.length > 0 ? collectionSlides : DEFAULT_COLLECTION_SLIDES
    );
    return slides.map((slide) => ({
      image: slide.src,
      caption: slide.caption,
      href: slide.href,
    }));
  }, [collectionSlides]);

  return (
    <StoreShell>
      <HeroSection />

      <section className="relative z-10 bg-background">
        <div className="mx-auto max-w-7xl px-6 pt-16 md:pt-20">
          <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
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

        <FeaturedCarousel items={carouselItems} autoplay interval={4} />

        <div className="pb-16 md:pb-20" />
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div
            className="relative w-full"
            style={{ height: "min(78svh, 720px)" }}
          >
            {morphItems.length > 0 ? (
              <MorphSlider
                key={morphItems.map((item) => item.image).join("|")}
                items={morphItems}
                transition="melt"
                intensity={0.55}
                aberration={0.35}
                drift={0.4}
                autoplay
                overlayColor="#05060a"
                duration={1.1}
                ease="power2.inOut"
                scale={2.4}
                autoplayDelay={5}
                loop
                radius={20}
                showCaptions
                showControls
                showIndicators
                className="font-nav-display"
              />
            ) : null}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
