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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brand, categories as seedCategories } from "@/lib/data";
import { loadCountries, type CountryOption } from "@/lib/countries";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const navIcon = "size-7 stroke-[1.5]";
const LOCATION_KEY = "ayesha-location";

function HeaderLogo({ light }: { light: boolean }) {
  return (
    <Link href="/" aria-label="Ayesha's" className="inline-flex items-center">
      <img
        src={brand.wordmark}
        alt="Ayesha's"
        className={cn(
          "h-8 w-auto transition-[filter] duration-300 sm:h-9 md:h-10",
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
      className="relative inline-flex size-10 cursor-pointer items-center justify-center"
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
      className="relative inline-flex size-12 cursor-pointer items-center justify-center"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span className="relative block h-5 w-7">
        <span
          className={cn(
            "absolute left-0 block h-[2px] w-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
          )}
        />
        <span
          className={cn(
            "absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-[2px] w-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
  const [countryOpen, setCountryOpen] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [locationCode, setLocationCode] = useState("PK");
  const [locationName, setLocationName] = useState("Pakistan");
  const [countriesLoading, setCountriesLoading] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);
  const light = overHero && !searchOpen;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCATION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { code?: string; name?: string };
      if (parsed.code && parsed.name) {
        setLocationCode(parsed.code);
        setLocationName(parsed.name);
      }
    } catch {
      // ignore bad storage
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
    document.documentElement.style.setProperty("--announce-h", "0px");
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
  }, [overlay]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!countryOpen) return;
    setCountryQuery("");
    const id = window.setTimeout(() => countrySearchRef.current?.focus(), 50);
    if (countries.length > 0) return () => window.clearTimeout(id);

    let cancelled = false;
    setCountriesLoading(true);
    void loadCountries().then((list) => {
      if (cancelled) return;
      setCountries(list);
      setCountriesLoading(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [countryOpen, countries.length]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  function selectCountry(entry: CountryOption) {
    setLocationCode(entry.code);
    setLocationName(entry.name);
    window.localStorage.setItem(
      LOCATION_KEY,
      JSON.stringify({ code: entry.code, name: entry.name })
    );
    setCountryOpen(false);
  }

  const filteredCountries = countries.filter((entry) =>
    entry.name.toLowerCase().includes(countryQuery.trim().toLowerCase())
  );

  const shortLocation =
    locationName.length > 12 ? locationName.split(" ")[0] : locationName;

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 transition-colors duration-300",
          light ? "bg-transparent text-white" : "bg-white text-black"
        )}
      >
        <div className="relative flex h-16 items-center px-3 sm:px-6">
          <Hamburger open={open} onClick={() => setOpen(true)} />

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="pointer-events-auto">
              <HeaderLogo light={light} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-0">
            <button
              type="button"
              onClick={() => setCountryOpen(true)}
              className="group inline-flex cursor-pointer items-center gap-1 px-1 text-[13px] font-semibold tracking-[0.08em] uppercase outline-none transition-opacity hover:opacity-70 sm:gap-1.5 sm:px-1.5 sm:text-[15px]"
            >
              {shortLocation}
              <ChevronDown className="size-4 stroke-[1.5] sm:size-5" />
            </button>

            <button
              type="button"
              className="inline-flex size-10 cursor-pointer items-center justify-center"
              aria-label="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <Search className={navIcon} />
            </button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="inline-flex size-10 cursor-pointer items-center justify-center outline-none"
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

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <form
              onSubmit={submitSearch}
              className={cn(
                "bg-white text-black transition-opacity duration-300",
                searchOpen ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
                <Search className="size-5 shrink-0 stroke-[1.5] text-neutral-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search suits"
                  className="w-full bg-transparent text-left text-lg outline-none placeholder:text-neutral-400 sm:text-xl"
                />
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="size-6 stroke-[1.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>

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
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCountryOpen(true);
                }}
                className="animate-panel-item mb-2 flex items-center justify-between px-3 py-3.5 text-left text-[17px] transition-colors hover:bg-neutral-100"
                style={{ animationDelay: "20ms" }}
              >
                <span>{locationName}</span>
                <ChevronDown className="size-5 stroke-[1.5]" />
              </button>
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

      <Dialog open={countryOpen} onOpenChange={setCountryOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(80vh,560px)] w-[min(100%,420px)] gap-0 overflow-hidden rounded-none border-0 bg-white p-0 text-black shadow-2xl ring-1 ring-black/10 sm:max-w-md"
        >
          <DialogHeader className="gap-0 border-b border-black/8 px-5 pt-5 pb-4 text-left">
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle className="text-[13px] font-semibold tracking-[0.18em] uppercase">
                Select country
              </DialogTitle>
              <button
                type="button"
                className="inline-flex size-9 cursor-pointer items-center justify-center transition-transform duration-300 hover:rotate-90"
                aria-label="Close"
                onClick={() => setCountryOpen(false)}
              >
                <X className="size-5 stroke-[1.5]" />
              </button>
            </div>
            <div className="flex items-center gap-2 border border-black/10 bg-neutral-50 px-3 py-2.5">
              <Search className="size-4 shrink-0 stroke-[1.5] text-neutral-400" />
              <input
                ref={countrySearchRef}
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder="Search country"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
              />
            </div>
          </DialogHeader>
          <div className="max-h-[min(52vh,380px)] overflow-y-auto overscroll-contain">
            {countriesLoading ? (
              <p className="px-5 py-8 text-sm text-neutral-500">Loading countries…</p>
            ) : filteredCountries.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-500">No countries found</p>
            ) : (
              filteredCountries.map((entry) => (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => selectCountry(entry)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left text-[15px] transition-colors hover:bg-neutral-100"
                >
                  <span>{entry.name}</span>
                  {locationCode === entry.code ? (
                    <Check className="size-4 shrink-0" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
