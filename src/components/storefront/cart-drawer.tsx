"use client";

import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";

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
        className="flex w-full flex-col gap-0 rounded-none bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-heading text-2xl">Bag</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center px-6">
            <p className="text-sm text-muted-foreground">Your bag is empty.</p>
            <Button
              className="mt-6 w-fit rounded-none"
              asChild
            >
              <Link href="/shop" onClick={() => setCartOpen(false)}>
                Continue shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {lines.map(({ product, quantity }) => (
                <div key={product.id} className="grid grid-cols-[72px_1fr] gap-4">
                  <div className="relative w-[72px] shrink-0">
                    <SaleBadge compact />
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      sizes="72px"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="block truncate text-sm"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1">
                          <SalePrice price={product.price} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => removeFromCart(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex w-fit items-center border">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-sm"
                        onClick={() =>
                          updateCartQuantity(product.id, quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-sm"
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

            <div className="border-t px-6 py-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between pt-2 font-medium">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal + shipping)}</span>
                </div>
              </div>
              <Button asChild size="lg" className="mt-5 w-full rounded-none">
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
