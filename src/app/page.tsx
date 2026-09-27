"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import FlexCarousel from "@/components/storefront/flex-carousel";
import MorphSlider from "@/components/storefront/morph-slider";
import { HeroSection } from "@/components/storefront/hero-section";
import { StoreShell } from "@/components/storefront/store-shell";
import {
  DEFAULT_COLLECTION_SLIDES,
  usableCollectionSlides,
} from "@/lib/collection-slides";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
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
        slug: product.slug,
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

  const imageKey = carouselItems.map((item) => item.src).join("|");

  useEffect(() => {
    if (!imageKey) return;
    const links: HTMLLinkElement[] = [];
    for (const src of imageKey.split("|")) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      link.fetchPriority = "high";
      document.head.appendChild(link);
      links.push(link);

      const img = new window.Image();
      img.decoding = "async";
      img.fetchPriority = "high";
      img.src = src;
    }
    return () => {
      for (const link of links) link.remove();
    };
  }, [imageKey]);

  return (
    <StoreShell>
      <HeroSection />

      <section className="relative z-10 overflow-x-clip bg-background">
        <div className="mx-auto max-w-7xl px-6 pt-16 md:pt-20">
          <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
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
          className="relative w-screen max-w-[100vw] text-foreground"
          style={{ height: "min(78svh, 720px)", marginLeft: "calc(50% - 50vw)" }}
        >
          {carouselItems.length > 0 ? (
            <FlexCarousel
              items={carouselItems}
              preset="liquid"
              intro="glide"
              cardHeight={0.68}
              gap={18}
              squeeze={0.08}
              focusOnClick
              captions
              fit="natural"
              radius={0}
              lensWidth={0.82}
              lensHeight={1.12}
              tilt={28}
              roundness={0.6}
              bend={0.12}
              reach={0.22}
              curl="twist"
              dispersion={0.12}
              liquid={0}
              followCursor={false}
              autoplay
              interval={4}
              captureWheel
              className="font-nav-display"
              onSelect={(index) => {
                const item = carouselItems[index];
                if (item?.slug) router.push(`/product/${item.slug}`);
              }}
            />
          ) : null}
        </div>
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
