"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Home, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const pillClass =
  "pointer-events-auto inline-flex h-[3.4rem] min-w-[4.4rem] flex-col items-center justify-center gap-0.5 rounded-[1.35rem] border border-black/5 bg-white/95 px-3.5 text-[10px] shadow-[0_8px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl";

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
  }, [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  const isHome = pathname === "/";

  return (
    <>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center gap-3 px-5 pb-[max(0.85rem,env(safe-area-inset-bottom))] md:hidden"
        aria-label="Mobile"
      >
        <Link
          href="/"
          className={cn(
            pillClass,
            isHome ? "text-foreground" : "text-muted-foreground"
          )}
          aria-label="Home"
        >
          <Home className="size-5 stroke-[1.6]" />
          <span>Home</span>
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(pillClass, "text-muted-foreground")}
          aria-label="Search"
        >
          <Search className="size-5 stroke-[1.6]" />
          <span>Search</span>
        </button>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={cn(pillClass, "relative text-muted-foreground")}
          aria-label="Bag"
        >
          <span className="relative" data-cart-target>
            <ShoppingBag className="size-5 stroke-[1.6]" />
            {count > 0 ? (
              <span className="absolute -top-1.5 -right-2 flex size-3.5 items-center justify-center rounded-full bg-black text-[8px] text-white">
                {count}
              </span>
            ) : null}
          </span>
          <span>Bag</span>
        </button>
      </nav>

      {searchOpen ? (
        <div className="fixed inset-0 z-[70] bg-white md:hidden">
          <form
            onSubmit={submitSearch}
            className="flex h-14 items-center gap-3 border-b border-black/8 px-4"
          >
            <Search className="size-5 shrink-0 stroke-[1.5] text-neutral-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suits"
              className="w-full bg-transparent text-left text-lg outline-none placeholder:text-neutral-400"
            />
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X className="size-6 stroke-[1.5]" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
