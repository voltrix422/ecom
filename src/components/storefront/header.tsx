"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Info,
  Menu,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
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
import { useStore } from "@/lib/store";
import { cn } from "cn";

const navIcon = "size-[18px] stroke-[1.5]";

function HeaderLogo() {
  return (
    <Link href="/" aria-label="Ayesha's" className="inline-flex items-center">
      <img
        src={brand.wordmark}
        alt="Ayesha's"
        className="h-8 w-auto brightness-0 sm:h-10 md:h-11"
      />
    </Link>
  );
}

function CartButton() {
  const { cartCount, ready, setCartOpen } = useStore();
  const count = ready ? cartCount : 0;

  return (
    <button
      type="button"
      className="relative inline-flex size-9 cursor-pointer items-center justify-center"
      aria-label="Bag"
      onClick={() => setCartOpen(true)}
    >
      <span className="relative inline-flex" data-cart-target>
        <ShoppingBag className={navIcon} />
        <span className="absolute -top-1.5 -right-2 flex size-3.5 items-center justify-center rounded-full bg-black text-[8px] text-white">
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
    document.documentElement.style.setProperty(
      "--announce-h",
      hideSaleBanner ? "0px" : "40px"
    );
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [hideSaleBanner, searchOpen]);

  useEffect(() => {
    function onScroll() {
      if (!overlay) {
        setOverHero(false);
        return;
      }
      const announce = hideSaleBanner ? 0 : 40;
      setOverHero(window.scrollY < window.innerHeight - announce - 64);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay, hideSaleBanner]);

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
    <>
    {hideSaleBanner ? null : <SaleBanner />}
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 text-black",
        overHero ? "bg-transparent" : "bg-background"
      )}
    >
      <div className="relative flex h-16 items-center px-4 sm:px-8">
        <button
          type="button"
          className="inline-flex size-9 cursor-pointer items-center justify-center"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className={navIcon} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <div className="pointer-events-auto">
            <HeaderLogo />
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
            className="inline-flex size-9 cursor-pointer items-center justify-center"
            aria-label="Search"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search className={navIcon} />
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="inline-flex size-9 cursor-pointer items-center justify-center outline-none"
              aria-label="Account"
            >
              <User className={navIcon} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-60 rounded-none bg-white p-2 text-black shadow-xl ring-1 ring-black/10"
            >
              <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                Account
              </p>
              <DropdownMenuItem asChild className="cursor-pointer rounded-none px-3 py-3 text-sm text-black focus:bg-neutral-100">
                <Link href="/track">
                  <Package className={navIcon} />
                  Track order
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-none px-3 py-3 text-sm text-black focus:bg-neutral-100">
                <Link href="/help">
                  <RotateCcw className={navIcon} />
                  Refund
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-none px-3 py-3 text-sm text-black focus:bg-neutral-100">
                <Link href="/about">
                  <Info className={navIcon} />
                  About
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CartButton />
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
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(100%,320px)] gap-0 rounded-none border-0 bg-white p-0 text-black shadow-xl"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-5">
            <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
              Menu
            </p>
            <button
              type="button"
              className="inline-flex size-9 cursor-pointer items-center justify-center"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className={navIcon} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-[15px] hover:bg-neutral-100"
            >
              Shop all
            </Link>
            <p className="mt-5 px-3 pb-1 text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
              Category
            </p>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/shop?category=${category}`}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-[15px] hover:bg-neutral-100"
              >
                {category}
              </Link>
            ))}
            <div className="my-4 h-px bg-neutral-200" />
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-[15px] hover:bg-neutral-100"
            >
              Track order
            </Link>
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-[15px] hover:bg-neutral-100"
            >
              Refund
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-[15px] hover:bg-neutral-100"
            >
              About
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
    </>
  );
}
