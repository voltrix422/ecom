"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { SaleBadge } from "@/components/storefront/sale-badge";
import { SalePrice } from "@/components/storefront/sale-price";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import "./staggered-menu.css";

const LAYER_COLORS = ["#111111", "#d4d4d4"];

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

  const panelRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);
  const prevOpen = useRef(false);

  const lines = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const shipping = cartTotal >= 15000 ? 0 : 250;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) return;
    const layers = preContainer
      ? Array.from(preContainer.querySelectorAll<HTMLElement>(".sm-prelayer"))
      : [];
    gsap.set([panel, ...layers], { xPercent: 100 });
    if (backdropRef.current) gsap.set(backdropRef.current, { opacity: 0 });
  }, []);

  function playOpen() {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel || busyRef.current) return;
    busyRef.current = true;

    const layers = preContainer
      ? Array.from(preContainer.querySelectorAll<HTMLElement>(".sm-prelayer"))
      : [];
    const itemEls = Array.from(
      panel.querySelectorAll<HTMLElement>("[data-cart-line]")
    );
    const footer = panel.querySelector<HTMLElement>("[data-cart-footer]");

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    if (itemEls.length) gsap.set(itemEls, { yPercent: 120, opacity: 0 });
    if (footer) gsap.set(footer, { y: 24, opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        busyRef.current = false;
      },
    });

    if (backdropRef.current) {
      tl.to(backdropRef.current, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    }

    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.5, ease: "power4.out" },
        i * 0.07
      );
    });

    const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
    const panelInsert = lastTime + (layers.length ? 0.08 : 0);

    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.65, ease: "power4.out" },
      panelInsert
    );

    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power4.out",
          stagger: { each: 0.08, from: "start" },
        },
        panelInsert + 0.2
      );
    }

    if (footer) {
      tl.to(
        footer,
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
        panelInsert + 0.35
      );
    }

    openTlRef.current = tl;
  }

  function playClose() {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) return;

    openTlRef.current?.kill();
    const layers = preContainer
      ? Array.from(preContainer.querySelectorAll<HTMLElement>(".sm-prelayer"))
      : [];

    if (backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.28, ease: "power2.in" });
    }

    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        busyRef.current = false;
      },
    });
  }

  useEffect(() => {
    if (prevOpen.current === cartOpen) return;
    prevOpen.current = cartOpen;
    if (cartOpen) playOpen();
    else playClose();
  }, [cartOpen]);

  useEffect(() => {
    if (!cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cartOpen]);

  return (
    <div
      className="staggered-menu-wrapper fixed-wrapper"
      data-position="right"
      data-open={cartOpen || undefined}
      aria-hidden={!cartOpen}
      style={{ ["--sm-accent"]: "#111111" } as React.CSSProperties}
    >
      <div
        ref={backdropRef}
        className="sm-backdrop"
        onClick={() => setCartOpen(false)}
      />

      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {LAYER_COLORS.map((color, i) => (
          <div key={i} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>

      <aside
        ref={panelRef}
        className="staggered-menu-panel staggered-cart-panel flex h-full max-h-[100dvh] flex-col overflow-hidden"
        aria-label="Shopping bag"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <p className="font-nav-display text-[15px]">Bag</p>
          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
            aria-label="Close bag"
            onClick={() => setCartOpen(false)}
          >
            <X className="size-6 stroke-[1.5]" />
          </button>
        </div>

        <div className="sm-panel-inner flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0">
          {lines.length === 0 ? (
            <div
              data-cart-line
              className="flex flex-1 flex-col justify-center px-5"
            >
              <p className="font-nav-display text-[15px] text-neutral-500">
                Your bag is empty.
              </p>
              <Button className="mt-8 w-fit" asChild>
                <Link href="/shop" onClick={() => setCartOpen(false)}>
                  <span>Continue shopping</span>
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-2">
                {lines.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    data-cart-line
                    className="grid grid-cols-[72px_1fr] gap-3"
                  >
                    <div className="relative w-[72px] shrink-0">
                      <SaleBadge compact />
                      <MediaImage
                        src={product.image}
                        alt={product.name}
                        sizes="72px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={() => setCartOpen(false)}
                            className="font-nav-display block truncate text-[14px]"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1">
                            <SalePrice
                              price={product.price}
                              className="flex-wrap gap-1.5 [&_span:last-child]:text-[14px]"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="font-nav-display shrink-0 text-[11px] text-neutral-500 transition-colors hover:text-black"
                          onClick={() => removeFromCart(product.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex h-9 w-fit items-center rounded-md border border-black/15">
                        <button
                          type="button"
                          className="inline-flex size-9 items-center justify-center text-base transition-colors hover:bg-neutral-100"
                          onClick={() =>
                            updateCartQuantity(product.id, quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span className="font-nav-display w-7 text-center text-[13px] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          className="inline-flex size-9 items-center justify-center text-base transition-colors hover:bg-neutral-100"
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
                data-cart-footer
                className="shrink-0 border-t border-black/10 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                <div className="space-y-2 font-nav-display text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Shipping</span>
                    <span>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 text-[15px] font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal + shipping)}</span>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="mt-4 h-12 w-full text-[15px] font-semibold"
                >
                  <Link href="/checkout" onClick={() => setCartOpen(false)}>
                    <span>Checkout</span>
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
