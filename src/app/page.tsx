"use client";

import { useMemo } from "react";
import { FeaturedSection } from "@/components/storefront/featured-section";
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

      <FeaturedSection products={featured} />

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
