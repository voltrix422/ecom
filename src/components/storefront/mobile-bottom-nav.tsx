"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Home, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const pillClass =
  "pointer-events-auto inline-flex h-11 min-w-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-black/[0.06] bg-white px-2 text-[10px] font-semibold tracking-tight text-black shadow-[0_6px_20px_rgba(0,0,0,0.1)]";

const iconClass = "size-[17px] stroke-[2.25]";

type SearchPhase = "idle" | "expanded" | "typing";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, ready, setCartOpen, cartOpen } = useStore();
  const count = ready ? cartCount : 0;
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const open = phase !== "idle";
  const typing = phase === "typing";
  const hideNotch = cartOpen || sidebarOpen;

  useEffect(() => {
    if (typing) searchRef.current?.focus();
  }, [typing]);

  useEffect(() => {
    setPhase("idle");
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      setSidebarOpen(root.dataset.sidebarOpen === "1");
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-sidebar-open"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hideNotch) {
      setPhase("idle");
      setQuery("");
    }
  }, [hideNotch]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setPhase("idle");
  }

  function onSearchTap() {
    if (phase === "idle") {
      setPhase("expanded");
      return;
    }
    if (phase === "expanded") {
      setPhase("typing");
    }
  }

  function closeSearch() {
    setPhase("idle");
    setQuery("");
  }

  const isHome = pathname === "/";

  if (hideNotch) return null;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center gap-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Mobile"
    >
      <Link
        href="/"
        className={cn(
          pillClass,
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "-translate-x-2",
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
          "overflow-hidden transition-[min-width,padding,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "h-11 min-w-[min(52vw,12.5rem)] flex-row justify-start gap-1.5 px-2.5"
            : "min-w-[3.35rem]"
        )}
      >
        {typing ? (
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
              className="inline-flex size-6 shrink-0 items-center justify-center text-black/55"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <X className="size-3.5 stroke-[2.25]" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onSearchTap}
            className="inline-flex h-full w-full flex-col items-center justify-center gap-0.5"
            aria-label={open ? "Type to search" : "Search"}
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
          open && "translate-x-2"
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
