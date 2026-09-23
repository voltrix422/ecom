"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Info,
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

const navIcon = "size-[23px] stroke-[1.5]";

const locations = [
  { id: "pk", label: "Pakistan", detail: "Prices in PKR" },
  { id: "ae", label: "United Arab Emirates", detail: "Prices in AED" },
  { id: "sa", label: "Saudi Arabia", detail: "Prices in SAR" },
  { id: "gb", label: "United Kingdom", detail: "Prices in GBP" },
  { id: "us", label: "United States", detail: "Prices in USD" },
  { id: "ca", label: "Canada", detail: "Prices in CAD" },
] as const;

const LOCATION_KEY = "ayesha-location";

function HeaderLogo({ light }: { light: boolean }) {
  return (
    <Link href="/" aria-label="Ayesha's" className="inline-flex items-center">
      <img
        src={brand.wordmark}
        alt="Ayesha's"
        className={cn(
          "h-9 w-auto transition-[filter] duration-300 sm:h-11 md:h-12",
          light ? "" : "brightness-0"
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
      className="relative inline-flex size-11 cursor-pointer items-center justify-center"
      aria-label="Bag"
      onClick={() => setCartOpen(true)}
    >
      <span className="relative inline-flex" data-cart-target>
        <ShoppingBag className={navIcon} />
        <span
          className={cn(
            "absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full text-[9px]",
            light ? "bg-white text-black" : "bg-black text-white"
          )}
        >
          {count}
        </span>
      </span>
    </button>
  );
}

function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="relative inline-flex size-11 cursor-pointer items-center justify-center"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span className="relative block h-3.5 w-[22px]">
        <span
          className={cn(
            "absolute left-0 block h-[1.5px] w-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
          )}
        />
        <span
          className={cn(
            "absolute top-1/2 left-0 block h-[1.5px] w-full -translate-y-1/2 bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-[1.5px] w-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
          )}
        />
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
  const [locationId, setLocationId] = useState<string>("pk");
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const light = overHero;
  const location =
    locations.find((entry) => entry.id === locationId) ?? locations[0];

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCATION_KEY);
    if (stored && locations.some((entry) => entry.id === stored)) {
      setLocationId(stored);
    }
  }, []);

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
      setOverHero(window.scrollY < 8);
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

  function selectLocation(id: string) {
    setLocationId(id);
    window.localStorage.setItem(LOCATION_KEY, id);
  }

  return (
    <>
      {hideSaleBanner ? null : <SaleBanner />}
      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 transition-colors duration-300",
          light
            ? "bg-transparent text-white"
            : "bg-white text-black shadow-[0_1px_0_rgba(0,0,0,0.06)]"
        )}
      >
        <div className="relative flex h-16 items-center px-4 sm:px-8">
          <Hamburger open={open} onClick={() => setOpen(true)} />

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="pointer-events-auto">
              <HeaderLogo light={light} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="group hidden cursor-pointer items-center gap-1.5 px-2 text-[13px] font-semibold tracking-[0.1em] uppercase outline-none transition-opacity hover:opacity-70 sm:inline-flex">
                {location.label === "Pakistan" ? "Pakistan" : location.label.split(" ")[0]}
                <ChevronDown className="size-4 stroke-[1.5] transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={14}
                className="w-72 rounded-none border-0 bg-white p-2 text-black shadow-2xl ring-1 ring-black/8 duration-300 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-2 data-closed:animate-out data-closed:fade-out-0"
              >
                <DropdownMenuLabel className="px-3 pt-2 pb-2 text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                  Select location
                </DropdownMenuLabel>
                {locations.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    className="cursor-pointer rounded-none px-3 py-3 focus:bg-neutral-100"
                    onSelect={() => selectLocation(entry.id)}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm text-black">{entry.label}</span>
                      <span className="text-[11px] text-neutral-500">
                        {entry.detail}
                      </span>
                    </span>
                    {locationId === entry.id ? (
                      <Check className="size-4 text-black" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              className="inline-flex size-11 cursor-pointer items-center justify-center"
              aria-label="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <Search className={navIcon} />
            </button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="inline-flex size-11 cursor-pointer items-center justify-center outline-none"
                aria-label="Account"
              >
                <User className={navIcon} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={14}
                className="w-60 rounded-none border-0 bg-white p-2 text-black shadow-2xl ring-1 ring-black/8 duration-300"
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

            <CartButton light={light} />
          </div>
        </div>

        {searchOpen ? (
          <form
            onSubmit={submitSearch}
            className="animate-search-drop border-t-0 bg-white text-black"
          >
            <div className="flex h-16 items-center gap-4 px-4 sm:px-8">
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search suits"
                className="w-full bg-transparent text-left text-xl outline-none placeholder:text-neutral-400 sm:text-2xl"
              />
              <button
                type="button"
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <X className="size-7 stroke-[1.5]" />
              </button>
            </div>
          </form>
        ) : null}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[min(100%,340px)] gap-0 rounded-none border-0 bg-white p-0 text-black shadow-2xl duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:slide-in-from-left-16 data-closed:slide-out-to-left-16"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/8 px-5">
              <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
                Menu
              </p>
              <button
                type="button"
                className="inline-flex size-11 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-6 stroke-[1.5]" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="animate-panel-item px-3 py-3.5 text-[17px] transition-colors hover:bg-neutral-100"
                style={{ animationDelay: "40ms" }}
              >
                Shop all
              </Link>
              <p
                className="animate-panel-item mt-4 px-3 pb-1 text-[10px] tracking-[0.18em] text-neutral-500 uppercase"
                style={{ animationDelay: "80ms" }}
              >
                Category
              </p>
              {categories.map((category, index) => (
                <Link
                  key={category}
                  href={`/shop?category=${category}`}
                  onClick={() => setOpen(false)}
                  className="animate-panel-item px-3 py-2.5 text-[16px] transition-colors hover:bg-neutral-100"
                  style={{ animationDelay: `${120 + index * 45}ms` }}
                >
                  {category}
                </Link>
              ))}
              <div className="my-4 h-px bg-neutral-200" />
              {[
                { href: "/track", label: "Track order" },
                { href: "/help", label: "Refund" },
                { href: "/about", label: "About" },
              ].map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="animate-panel-item px-3 py-3.5 text-[16px] transition-colors hover:bg-neutral-100"
                  style={{ animationDelay: `${360 + index * 50}ms` }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
