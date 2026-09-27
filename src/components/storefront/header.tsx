"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { StaggeredMenu } from "@/components/storefront/staggered-menu";
import { flashPageVeil } from "@/components/page-veil";
import { brand, categories as seedCategories } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const navIcon = "size-7 stroke-[1.5]";

const accountLinks = [
  { href: "/track", label: "Track order", icon: Package },
  { href: "/help", label: "Refund", icon: RotateCcw },
  { href: "/about", label: "About", icon: Info },
] as const;

function HeaderLogo({
  light,
  className,
}: {
  light: boolean;
  className?: string;
}) {
  return (
    <Link href="/" aria-label="Ayesha's" className="inline-flex items-center">
      <img
        src={brand.wordmark}
        alt="Ayesha's"
        className={cn(
          "h-11 w-auto transition-[filter] duration-300 sm:h-12 md:h-[3.25rem]",
          light ? "brightness-0 invert" : "brightness-0",
          className
        )}
      />
    </Link>
  );
}

function CartButton({
  light,
  compact = false,
}: {
  light: boolean;
  compact?: boolean;
}) {
  const { cartCount, ready, setCartOpen } = useStore();
  const count = ready ? cartCount : 0;

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center",
        compact ? "size-9" : "size-10"
      )}
      aria-label="Bag"
      onClick={() => setCartOpen(true)}
    >
      <span className="relative inline-flex" data-cart-target>
        <ShoppingBag className={compact ? "size-5 stroke-[1.6]" : navIcon} />
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

function Hamburger({
  open,
  onClick,
  compact = false,
}: {
  open: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative z-[70] inline-flex cursor-pointer items-center justify-center",
        compact ? "size-8" : "size-10"
      )}
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span className={cn("relative block", compact ? "h-2.5 w-3.5" : "h-3.5 w-5")}>
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

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  function clearClose() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function show() {
    clearClose();
    setOpen(true);
  }

  function hide() {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    return () => clearClose();
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          hide();
        }
      }}
    >
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center outline-none"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <User className={navIcon} />
      </button>

      <div
        className={cn(
          "absolute top-full right-0 z-50 pt-3 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.96] opacity-0"
        )}
      >
        <div className="w-[min(94vw,360px)] overflow-hidden rounded-md border-0 bg-black/60 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-100">
          <div className="flex min-w-[300px] items-stretch gap-0">
            {accountLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5 px-3 py-5 text-center transition-colors hover:bg-white/10",
                    open ? "animate-account-link" : ""
                  )}
                  style={{ animationDelay: `${60 + index * 70}ms` }}
                  onClick={() => {
                    flashPageVeil();
                    setOpen(false);
                  }}
                >
                  <Icon className="size-6 stroke-[1.25] text-white transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="font-nav-display text-[13px] leading-tight text-white sm:text-[14px]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ hideSaleBanner = false }: { hideSaleBanner?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { categories: storeCategories } = useStore();
  const categories =
    storeCategories.length > 0 ? storeCategories : [...seedCategories];
  const overlay = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [overHero, setOverHero] = useState(overlay);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const light = overHero && !searchOpen && !menuOpen;

  const menuItems = useMemo(
    () => [
      { label: "Shop all", ariaLabel: "Shop all products", link: "/shop" },
      ...categories.map((category) => ({
        label: category,
        ariaLabel: `Shop ${category}`,
        link: `/shop?category=${encodeURIComponent(category)}`,
      })),
      { label: "Track order", ariaLabel: "Track your order", link: "/track" },
      { label: "Refund", ariaLabel: "Refund help", link: "/help" },
      { label: "About", ariaLabel: "About Ayesha's", link: "/about" },
    ],
    [categories]
  );

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
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.sidebarOpen = menuOpen ? "1" : "";
    return () => {
      document.documentElement.dataset.sidebarOpen = "";
    };
  }, [menuOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "relative z-50 bg-transparent text-black transition-colors duration-300",
          light && "md:text-white"
        )}
      >
        {/* Mobile: hamburger + logo left, bag right */}
        <div className="relative flex h-16 items-center justify-between px-2 md:hidden">
          <div className="flex items-center gap-0.5">
            <Hamburger
              compact
              open={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            />
            <HeaderLogo light={false} className="h-10 sm:h-10" />
          </div>
          <CartButton light={false} compact />
        </div>

        {/* Desktop / tablet header */}
        <div className="relative hidden h-16 items-center px-3 sm:px-6 md:flex">
          <Hamburger
            open={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          />

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="pointer-events-auto">
              <HeaderLogo light={light} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-0">
            <button
              type="button"
              className="inline-flex size-10 cursor-pointer items-center justify-center"
              aria-label="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <Search className={navIcon} />
            </button>

            <AccountMenu />
            <CartButton light={light} />
          </div>
        </div>

        <div
          className={cn(
            "hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:grid",
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
      </header>

      <StaggeredMenu
        position="left"
        hideChrome
        isFixed
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={menuItems}
        displayItemNumbering={false}
        displaySocials={false}
        colors={["#111111", "#cfcfcf"]}
        accentColor="#111111"
        closeOnClickAway={false}
      />
    </>
  );
}
