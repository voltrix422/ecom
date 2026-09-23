"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaleBanner } from "@/components/storefront/sale-banner";
import { brand, categories as seedCategories } from "@/lib/data";
import { REVEAL_HEADER_EVENT } from "@/lib/fly-to-cart";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const navIcon = "size-[15px] stroke-[1.5]";

function HeaderLogo({ light }: { light: boolean }) {
  return (
    <Link href="/" aria-label="Ayesha's" className="inline-flex items-center">
      <img
        src={brand.wordmark}
        alt="Ayesha's"
        className={cn(
          "h-8 w-auto sm:h-10 md:h-11",
          light
            ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
            : "brightness-0"
        )}
      />
    </Link>
  );
}

function CartButton({ light }: { light: boolean }) {
  const { cartCount, ready, setCartOpen } = useStore();
  const count = ready ? cartCount : 0;

  return (
    <button
      type="button"
      className="relative inline-flex size-8 cursor-pointer items-center justify-center"
      aria-label="Bag"
      onClick={() => setCartOpen(true)}
    >
      <span className="relative inline-flex" data-cart-target>
        <ShoppingBag className={navIcon} />
        <span
          className={cn(
            "absolute -top-1.5 -right-2 flex size-3.5 items-center justify-center rounded-full text-[8px]",
            light ? "bg-white text-black" : "bg-black text-white"
          )}
        >
          {count}
        </span>
      </span>
    </button>
  );
}

export function Header({ hideSaleBanner = false }: { hideSaleBanner?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { categories: storeCategories } = useStore();
  const categories =
    storeCategories.length > 0 ? storeCategories : [...seedCategories];
  const overlay = pathname === "/";
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(overlay);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    function syncHeight() {
      if (!node) return;
      document.documentElement.style.setProperty(
        "--site-header-h",
        `${node.offsetHeight}px`
      );
    }

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [hideSaleBanner, searchOpen]);

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
    function onReveal() {
      setHidden(false);
    }

    window.addEventListener(REVEAL_HEADER_EVENT, onReveal);
    return () => window.removeEventListener(REVEAL_HEADER_EVENT, onReveal);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "z-50 transition-transform duration-300",
        overHero ? "text-white" : "text-black",
        overlay
          ? cn(
              "fixed inset-x-0 top-0",
              overHero ? "bg-transparent" : "bg-background/95 backdrop-blur-sm"
            )
          : "sticky top-0 bg-background",
        hidden && !open && !searchOpen && "-translate-y-full"
      )}
    >
      {hideSaleBanner ? null : <SaleBanner />}
      <div className="relative flex h-16 items-center px-3 sm:px-6">
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className={navIcon} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <div className="pointer-events-auto">
            <HeaderLogo light={overHero} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="hidden cursor-pointer items-center gap-1 px-2 text-sm font-semibold tracking-[0.08em] uppercase outline-none sm:inline-flex">
              Pakistan
              <ChevronDown className={navIcon} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-none">
              <DropdownMenuLabel className="text-foreground">
                Pakistan · prices in PKR
              </DropdownMenuLabel>
              <DropdownMenuLabel>Free delivery over Rs 15,000</DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            className="inline-flex size-8 cursor-pointer items-center justify-center"
            aria-label="Search"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search className={navIcon} />
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="inline-flex size-8 cursor-pointer items-center justify-center outline-none"
              aria-label="Account"
            >
              <User className={navIcon} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-none">
              <DropdownMenuItem asChild>
                <Link href="/track">Track order</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help">Refund</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about">About</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CartButton light={overHero} />
        </div>
      </div>

      {searchOpen ? (
        <form
          onSubmit={submitSearch}
          className="border-t border-black/10 bg-white px-4 py-3 text-black sm:px-6"
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <Search className="size-4 shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search suits"
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              className="inline-flex size-8 cursor-pointer items-center justify-center"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>
        </form>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[min(100%,280px)] rounded-none bg-background p-0">
          <SheetHeader className="px-6 py-5">
            <SheetTitle className="sr-only">Ayesha's</SheetTitle>
            <img
              src={brand.wordmark}
              alt="Ayesha's"
              className="h-8 w-auto brightness-0"
            />
          </SheetHeader>
          <nav className="flex flex-col gap-4 px-6 py-4 text-sm">
            <Link href="/shop" onClick={() => setOpen(false)} className="text-foreground">
              Shop all
            </Link>
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
            <Link href="/track" onClick={() => setOpen(false)} className="text-foreground">
              Track order
            </Link>
            <Link href="/help" onClick={() => setOpen(false)} className="text-foreground">
              Refund
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className="text-foreground">
              About
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
