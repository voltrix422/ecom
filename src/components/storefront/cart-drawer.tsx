"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "cn";

export function CartDrawer() {
  const {
    cart,
    products,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartTotal,
  } = useStore();

  const lines = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const shipping = cartTotal >= 15000 ? 0 : 250;

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 rounded-none border-0 bg-white p-0 text-black shadow-2xl duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:slide-in-from-right-16 data-closed:slide-out-to-right-16 sm:max-w-[420px]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/8 px-6">
          <SheetTitle className="animate-panel-in text-[15px] tracking-[0.18em] uppercase">
            Bag
          </SheetTitle>
          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
            aria-label="Close bag"
            onClick={() => setCartOpen(false)}
          >
            <X className="size-6 stroke-[1.5]" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="animate-panel-in flex flex-1 flex-col justify-center px-6">
            <p className="text-base text-neutral-500">Your bag is empty.</p>
            <Button
              className="mt-8 w-fit rounded-none"
              asChild
            >
              <Link href="/shop" onClick={() => setCartOpen(false)}>
                Continue shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-7">
              {lines.map(({ product, quantity }, index) => (
                <div
                  key={product.id}
                  className="animate-panel-in grid grid-cols-[88px_1fr] gap-5"
                  style={{ animationDelay: `${60 + index * 70}ms` }}
                >
                  <div className="relative w-[88px] shrink-0">
                    <SaleBadge compact />
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      sizes="88px"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="block truncate text-[15px]"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1.5">
                          <SalePrice price={product.price} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs tracking-[0.08em] text-neutral-500 uppercase transition-colors hover:text-black"
                        onClick={() => removeFromCart(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 flex w-fit items-center border border-black/15">
                      <button
                        type="button"
                        className="px-3.5 py-2 text-base transition-colors hover:bg-neutral-100"
                        onClick={() =>
                          updateCartQuantity(product.id, quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3.5 py-2 text-base transition-colors hover:bg-neutral-100"
                        onClick={() =>
                          updateCartQuantity(product.id, quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="animate-panel-in border-t border-black/8 px-6 py-6"
              style={{ animationDelay: "180ms" }}
            >
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-medium">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal + shipping)}</span>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className={cn(
                  "mt-6 h-12 w-full rounded-none text-[12px] tracking-[0.18em] uppercase"
                )}
              >
                <Link href="/checkout" onClick={() => setCartOpen(false)}>
                  Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
