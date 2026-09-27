"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MediaImage } from "@/components/media-image";
import FlexCarousel from "@/components/storefront/flex-carousel";
import { HeroSection } from "@/components/storefront/hero-section";
import { StoreShell } from "@/components/storefront/store-shell";
import { useStore } from "@/lib/store";

const collections = [
  {
    title: "Lawn",
    href: "/shop?category=Lawn",
    image: "/products/suit-ivory-garden.png",
  },
  {
    title: "Chiffon",
    href: "/shop?category=Chiffon",
    image: "/products/suit-midnight.png",
  },
  {
    title: "Khaddar",
    href: "/shop?category=Khaddar",
    image: "/products/suit-dust-rose.png",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { products } = useStore();
  const featured = products.filter((product) => product.featured);
  const carouselItems = featured.map((product) => ({
    src: product.image,
    alt: product.name,
    title: product.name,
    subtitle: product.category,
    slug: product.slug,
  }));

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

      <section className="relative z-10 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
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
          <div
            className="relative w-full text-foreground"
            style={{ height: "min(78svh, 720px)" }}
          >
            {carouselItems.length > 0 ? (
              <FlexCarousel
                items={carouselItems}
                preset="liquid"
                intro="none"
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
                autoplay={false}
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
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.title} href={collection.href} className="group">
              <MediaImage
                src={collection.image}
                alt={collection.title}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="transition-opacity duration-300 group-hover:opacity-80"
              />
              <p className="font-nav-display mt-4 text-[18px]">{collection.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
