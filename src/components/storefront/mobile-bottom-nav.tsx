"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Home, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const pillClass =
  "pointer-events-auto inline-flex h-12 min-w-[3.85rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-black/[0.06] bg-white px-3 text-[10px] font-semibold tracking-tight text-black shadow-[0_6px_20px_rgba(0,0,0,0.1)]";

const iconClass = "size-[18px] stroke-[2.25]";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, ready, setCartOpen } = useStore();
  const count = ready ? cartCount : 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  const isHome = pathname === "/";

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center gap-1.5 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Mobile"
    >
      <Link
        href="/"
        className={cn(
          pillClass,
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          searchOpen && "-translate-x-1.5",
          !isHome && "text-black/75"
        )}
        aria-label="Home"
      >
        <Home className={iconClass} fill={isHome ? "currentColor" : "none"} />
        <span>Home</span>
      </Link>

      <form
        onSubmit={submitSearch}
        className={cn(
          pillClass,
          "overflow-hidden transition-[width,min-width,padding,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          searchOpen
            ? "h-12 min-w-[min(58vw,13.5rem)] flex-row justify-start gap-2 px-3"
            : "min-w-[3.85rem]"
        )}
      >
        {searchOpen ? (
          <>
            <Search className={cn(iconClass, "shrink-0 text-black/55")} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-black outline-none placeholder:text-black/35"
              aria-label="Search suits"
            />
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-black/55"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-full w-full flex-col items-center justify-center gap-0.5"
            aria-label="Search"
          >
            <Search className={iconClass} />
            <span>Search</span>
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className={cn(
          pillClass,
          "relative text-black/75 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          searchOpen && "translate-x-1.5"
        )}
        aria-label="Bag"
      >
        <span className="relative" data-cart-target>
          <ShoppingBag className={iconClass} />
          {count > 0 ? (
            <span className="absolute -top-1.5 -right-2 flex size-3.5 items-center justify-center rounded-full bg-black text-[8px] font-semibold text-white">
              {count}
            </span>
          ) : null}
        </span>
        <span>Bag</span>
      </button>
    </nav>
  );
}
