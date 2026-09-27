"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreShell } from "@/components/storefront/store-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductShare } from "@/components/storefront/product-share";
import { flyToCart } from "@/lib/fly-to-cart";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "cn";

function likedKey(id: string) {
  return `ayeshaswear:liked:${id}`;
}

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
  const [liked, setLiked] = useState(false);
  const [bagPulse, setBagPulse] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const desktopGalleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!product) return;
    setLiked(window.localStorage.getItem(likedKey(product.id)) === "1");
  }, [product]);

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

  const piece = product;
  const gallery =
    piece.images && piece.images.length > 0
      ? piece.images
      : [piece.image];
  const related = products
    .filter((item) => item.category === piece.category && item.id !== piece.id)
    .slice(0, 3);
  const currentSrc = gallery[Math.min(activeImage, gallery.length - 1)];

  function galleryRect() {
    if (typeof window === "undefined") return null;
    const node =
      window.innerWidth < 768
        ? mobileGalleryRef.current
        : desktopGalleryRef.current;
    return node?.getBoundingClientRect() ?? null;
  }

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(likedKey(piece.id), next ? "1" : "0");
  }

  function handleAddToBag() {
    addToCart(piece.id, quantity);
    setBagPulse(true);
    window.setTimeout(() => setBagPulse(false), 500);
    flyToCart(currentSrc, galleryRect());
  }

  function handleBuy() {
    if (buying) return;
    setBuying(true);
    addToCart(piece.id, quantity);
    window.setTimeout(() => {
      router.push("/checkout");
    }, 220);
  }

  return (
    <StoreShell>
      {/* Mobile detail layout */}
      <div className="md:hidden">
        <div className="flex h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] flex-col">
          <div
            ref={mobileGalleryRef}
            className="relative min-h-0 w-full flex-[1_1_0%] bg-white"
          >
            <MediaImage
              src={currentSrc}
              alt={piece.name}
              fill
              priority
              fit="contain"
              sizes="100vw"
            />
          </div>

          {gallery.length > 1 ? (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pt-0.5">
              {gallery.map((src, index) => (
                <button
                  key={`${src.slice(0, 32)}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "relative h-9 w-6 shrink-0 overflow-hidden rounded-sm border",
                    activeImage === index
                      ? "border-foreground"
                      : "border-transparent opacity-70"
                  )}
                >
                  <MediaImage
                    src={src}
                    alt={`${piece.name} ${index + 1}`}
                    fill
                    fit="cover"
                    sizes="24px"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="shrink-0 px-4 pt-0.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-0.5 text-foreground">
              <button
                type="button"
                onClick={toggleLike}
                className="inline-flex size-9 items-center justify-center text-foreground"
                aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
                aria-pressed={liked}
              >
                <Heart
                  className={cn(
                    "size-[18px] text-foreground transition-transform",
                    liked && "fill-foreground scale-110"
                  )}
                  strokeWidth={1.7}
                />
              </button>

              <button
                type="button"
                onClick={handleAddToBag}
                disabled={piece.stock <= 0}
                className={cn(
                  "inline-flex size-9 items-center justify-center text-foreground transition-transform disabled:opacity-40",
                  bagPulse && "scale-110"
                )}
                aria-label="Add to bag"
              >
                <ShoppingBag
                  className="size-[18px] text-foreground"
                  strokeWidth={1.7}
                />
              </button>

              <div className="inline-flex size-9 items-center justify-center">
                <ProductShare
                  product={piece}
                  className="size-9 rounded-none text-foreground hover:bg-transparent hover:text-foreground [&_svg]:size-[18px]"
                />
              </div>

              <p className="ml-auto font-nav-display text-[20px] font-semibold tracking-tight text-foreground tabular-nums">
                {formatPrice(piece.price)}
              </p>
            </div>

            <h1 className="mt-0.5 font-nav-display text-[18px] leading-none tracking-tight text-foreground">
              {piece.name}
            </h1>

            <div className="mt-0.5">
              <p className="line-clamp-2 text-[11px] leading-snug text-foreground/55">
                {piece.description}
              </p>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="mt-0.5 text-[11px] font-medium tracking-wide text-foreground underline underline-offset-2"
              >
                Read more
              </button>
            </div>

            <Button
              size="lg"
              className={cn(
                "mt-2 h-11 w-full rounded-md border-0 bg-black text-[16px] font-bold tracking-wide text-white shadow-none transition-opacity hover:bg-black/90",
                buying && "opacity-70"
              )}
              disabled={piece.stock <= 0 || buying}
              onClick={handleBuy}
            >
              {buying ? "Opening…" : "Buy"}
            </Button>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="px-4 pt-10 pb-6">
            <h2 className="font-nav-display text-xl">More like this</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  badgeTone="soft"
                  compact
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Desktop / tablet layout */}
      <div className="mx-auto hidden max-w-7xl grid-cols-2 items-start gap-16 px-6 pt-2 pb-8 md:grid">
        <div>
          <div
            ref={desktopGalleryRef}
            className="relative h-[calc(100svh-11rem)] w-full"
          >
            <MediaImage
              src={currentSrc}
              alt={piece.name}
              fill
              priority
              sizes="50vw"
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
                    alt={`${piece.name} ${index + 1}`}
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
          <div className="relative mb-3 flex justify-end">
            <ProductShare product={piece} />
          </div>
          <div className="relative mt-10 max-w-md">
            <h1 className="font-nav-display truncate whitespace-nowrap text-[34px] leading-none tracking-tight text-foreground/90">
              {piece.name}
            </h1>
            <p className="mt-3 font-nav-display text-[26px] font-semibold tracking-tight text-foreground tabular-nums">
              {formatPrice(piece.price)}
            </p>
            <p className="mt-4 text-[13px] leading-snug tracking-wide text-foreground/55 normal-case">
              {piece.description}
            </p>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="mt-2 text-[12px] font-medium tracking-wide text-foreground underline underline-offset-2"
            >
              Read more
            </button>
            <div className="mt-6 flex w-full max-w-md flex-col gap-2.5">
              <div className="mx-auto flex h-12 items-center justify-center gap-1">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-[26px] leading-none text-foreground/75 hover:text-foreground"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="font-nav-display min-w-9 text-center text-[22px] tabular-nums text-foreground/90">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-[26px] leading-none text-foreground/75 hover:text-foreground"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.min(piece.stock || 1, value + 1)
                    )
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="h-12 w-full border-0 shadow-none"
                disabled={piece.stock <= 0}
                onClick={handleAddToBag}
              >
                Add to bag
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-0 bg-black/8 shadow-none"
                disabled={piece.stock <= 0 || buying}
                onClick={handleBuy}
              >
                {buying ? "Opening…" : "Buy now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto hidden max-w-7xl px-6 pt-6 pb-20 md:block md:pt-10">
          <h2 className="font-nav-display text-2xl md:text-3xl">
            More {piece.category}
          </h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} badgeTone="soft" />
            ))}
          </div>
        </section>
      ) : null}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-lg p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nav-display text-left text-[18px] tracking-tight uppercase">
              {piece.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-left normal-case">
            <p className="text-[13px] leading-relaxed text-foreground/70">
              {piece.description}
            </p>
            <div>
              <p className="text-[11px] tracking-[0.14em] text-foreground/40 uppercase">
                Details
              </p>
              <ul className="mt-2 space-y-1.5">
                {piece.details.map((detail) => (
                  <li
                    key={detail}
                    className="text-[13px] leading-snug text-foreground/75"
                  >
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-black/8 pt-3 text-[13px]">
              <div>
                <p className="text-[10px] tracking-[0.14em] text-foreground/40 uppercase">
                  Category
                </p>
                <p className="mt-0.5 text-foreground/80">{piece.category}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.14em] text-foreground/40 uppercase">
                  Color
                </p>
                <p className="mt-0.5 text-foreground/80">{piece.color}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.14em] text-foreground/40 uppercase">
                  Price
                </p>
                <p className="mt-0.5 font-nav-display text-foreground tabular-nums">
                  {formatPrice(piece.price)}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.14em] text-foreground/40 uppercase">
                  Stock
                </p>
                <p className="mt-0.5 text-foreground/80">
                  {piece.stock > 0 ? `${piece.stock} available` : "Out of stock"}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StoreShell>
  );
}
