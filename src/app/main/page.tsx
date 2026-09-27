"use client";

import { useMemo } from "react";
import { FeaturedSection } from "@/components/storefront/featured-section";
import MorphSlider from "@/components/storefront/morph-slider";
import { HeroSection } from "@/components/storefront/hero-section";
import { HomePinGrid } from "@/components/storefront/home-pin-grid";
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
      {/* Mobile: Pinterest-style image discovery */}
      <HomePinGrid />

      {/* Desktop / tablet: existing hero + featured + collection */}
      <div className="hidden md:block">
        <HeroSection />

        <FeaturedSection products={featured} />

        <section>
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <div
              className="relative w-full"
              style={{ height: "min(92svh, 920px)" }}
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
                  radius={4}
                  showCaptions
                  showControls
                  showIndicators
                  className="font-nav-display"
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </StoreShell>
  );
}
