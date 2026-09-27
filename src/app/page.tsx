"use client";

import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductCard } from "@/components/storefront/product-card";
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
  const { products } = useStore();
  const featured = products.filter((product) => product.featured).slice(0, 3);

  return (
    <StoreShell>
      <HeroSection />

      <section className="relative z-10 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-nav-display text-[12px] text-muted-foreground">
                Selected
              </p>
              <h2 className="font-nav-display mt-2 text-3xl md:text-4xl">
                Featured suits
              </h2>
            </div>
            <Link
              href="/shop"
              className="font-nav-display text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} badgeTone="soft" />
            ))}
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
