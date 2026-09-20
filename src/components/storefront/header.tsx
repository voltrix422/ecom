"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SaleBanner } from "@/components/storefront/sale-banner";
import { BrandWordmark } from "@/components/brand-logo";
import { brand, categories as seedCategories } from "@/lib/data";
import { REVEAL_HEADER_EVENT } from "@/lib/fly-to-cart";
import { useStore } from "@/lib/store";
import { cn } from "cn";

function NavLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  const { cartCount, ready } = useStore();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "cursor-pointer text-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {href === "/cart" && ready && cartCount > 0 ? (
        <span className="ml-1 text-xs">({cartCount})</span>
      ) : null}
    </Link>
  );
}

function CartButton() {
  const { cartCount, ready, setCartOpen } = useStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-none"
      aria-label="Bag"
      onClick={() => setCartOpen(true)}
    >
      <span className="relative inline-flex" data-cart-target>
        <ShoppingBag className="size-4" />
        {ready && cartCount > 0 ? (
          <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
            {cartCount}
          </span>
        ) : null}
      </span>
    </Button>
  );
}

export function Header({ hideSaleBanner = false }: { hideSaleBanner?: boolean }) {
  const pathname = usePathname();
  const { categories: storeCategories } = useStore();
  const categories =
    storeCategories.length > 0 ? storeCategories : [...seedCategories];
  const overlay = pathname === "/";
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(overlay);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    function syncHeight() {
      document.documentElement.style.setProperty(
        "--site-header-h",
        `${node.offsetHeight}px`
      );
    }

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [hideSaleBanner]);

  useEffect(() => {
    setOverHero(overlay && window.scrollY < 40);
  }, [overlay]);

  useEffect(() => {
    let lastY = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      if (overlay) setOverHero(y < 40);
      if (y < 80) {
        setHidden(false);
      } else if (y > lastY + 12) {
        setHidden(true);
      } else if (y < lastY - 8) {
        setHidden(false);
      }
      lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  useEffect(() => {
    if (hidden) setCategoriesOpen(false);
  }, [hidden]);

  useEffect(() => {
    function onReveal() {
      setHidden(false);
    }

    window.addEventListener(REVEAL_HEADER_EVENT, onReveal);
    return () => window.removeEventListener(REVEAL_HEADER_EVENT, onReveal);
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "z-50 transition-transform duration-300",
        overlay
          ? cn(
              "fixed inset-x-0 top-0",
              overHero ? "bg-transparent" : "bg-background/95 backdrop-blur-sm"
            )
          : "sticky top-0 bg-background",
        hidden && !open && "-translate-y-full"
      )}
      onMouseLeave={() => setCategoriesOpen(false)}
    >
      {hideSaleBanner ? null : <SaleBanner />}
      <div className="relative mx-auto flex h-[4.75rem] max-w-7xl items-center px-6 md:px-10">
        <BrandWordmark />

        <div className="ml-auto flex items-center gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/shop" label="Shop" pathname={pathname} />
            <button
              type="button"
              onClick={() => setCategoriesOpen((value) => !value)}
              onMouseEnter={() => setCategoriesOpen(true)}
              aria-expanded={categoriesOpen}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 text-sm",
                categoriesOpen
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Category
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  categoriesOpen && "rotate-180"
                )}
              />
            </button>
            <NavLink href="/help" label="Refund" pathname={pathname} />
            <NavLink href="/track" label="Track" pathname={pathname} />
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
          <CartButton />
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-2 hidden px-6 transition-opacity duration-200 md:block",
            categoriesOpen ? "pointer-events-auto opacity-100" : "opacity-0"
          )}
        >
          <div className="flex items-center justify-end gap-6">
            <Link
              href="/shop"
              onClick={() => setCategoriesOpen(false)}
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/shop?category=${category}`}
                onClick={() => setCategoriesOpen(false)}
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[min(100%,280px)] rounded-none bg-background p-0">
          <SheetHeader className="px-6 py-5">
            <SheetTitle className="sr-only">{brand.name}</SheetTitle>
            <BrandWordmark href={null} />
          </SheetHeader>
          <nav className="flex flex-col gap-4 px-6 py-4 text-sm">
            <NavLink
              href="/shop"
              label="Shop"
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Category
            </p>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/shop?category=${category}`}
                onClick={() => setOpen(false)}
                className="pl-2 text-foreground"
              >
                {category}
              </Link>
            ))}
            <NavLink
              href="/help"
              label="Refund"
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
            <NavLink
              href="/track"
              label="Track"
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
