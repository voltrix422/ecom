"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useRef, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreShell } from "@/components/storefront/store-shell";
import { Button } from "@/components/ui/button";
import { ProductShare } from "@/components/storefront/product-share";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { flyToCart } from "@/lib/fly-to-cart";
import { useStore } from "@/lib/store";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { getProduct, addToCart, products } = useStore();
  const product = getProduct(slug);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  if (!product) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h1 className="text-3xl">Piece not found</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/shop">
              <span>Return to shop</span>
            </Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <StoreShell>
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 pt-1 pb-6 lg:grid-cols-2 lg:gap-16 lg:pt-2 lg:pb-8">
        <div>
          <div
            ref={galleryRef}
            className="relative h-[66svh] w-full lg:h-[calc(100svh-11rem)]"
          >
            <SaleBadge />
            <MediaImage
              src={gallery[Math.min(activeImage, gallery.length - 1)]}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
          {gallery.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {gallery.map((src, index) => (
                <button
                  key={`${src.slice(0, 32)}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-20 w-16 shrink-0 border ${
                    activeImage === index
                      ? "border-foreground"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <MediaImage
                    src={src}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-y-8 -left-10 -right-6 hidden bg-gradient-to-l from-background via-background/70 to-transparent lg:block" />
          <div className="relative mb-6 flex justify-end">
            <ProductShare product={product} />
          </div>
          <div className="relative mt-24 max-w-md md:mt-40">
            <h1 className="font-nav-display text-4xl leading-[0.95] text-foreground/90 md:text-5xl">
              {product.name}
            </h1>
            <div className="mt-5">
              <SalePrice price={product.price} size="md" />
            </div>
            <p className="mt-8 text-[16px] leading-7 text-foreground/60">
              {product.description}
            </p>
            <p className="mt-4 font-nav-display text-[12px] leading-5 text-foreground/40">
              {product.details.join(" · ")}
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col gap-3">
              <div className="flex h-12 w-full items-center justify-between rounded-md border border-black/15 px-2">
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center text-lg hover:text-foreground"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  −
                </button>
                <span className="font-nav-display min-w-8 text-center text-[15px] tabular-nums text-foreground/80">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center text-lg hover:text-foreground"
                  onClick={() =>
                    setQuantity((value) => Math.min(product.stock || 1, value + 1))
                  }
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="h-12 w-full"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product.id, quantity);
                  flyToCart(
                    gallery[Math.min(activeImage, gallery.length - 1)],
                    galleryRef.current?.getBoundingClientRect() ?? null
                  );
                }}
              >
                Add to bag
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product.id, quantity);
                  router.push("/checkout");
                }}
              >
                Buy now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-10">
          <h2 className="font-nav-display text-3xl">More {product.category}</h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} badgeTone="soft" />
            ))}
          </div>
        </section>
      ) : null}
    </StoreShell>
  );
}
