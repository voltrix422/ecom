"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Info,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const accountLinks = [
  { href: "/track", label: "Track order", icon: Package },
  { href: "/help", label: "Refund", icon: RotateCcw },
  { href: "/about", label: "About", icon: Info },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, ready, setCartOpen } = useStore();
  const count = ready ? cartCount : 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setProfileOpen(false);
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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        aria-label="Mobile"
      >
        <div className="pointer-events-auto flex h-[3.65rem] w-full max-w-[22rem] items-center justify-between rounded-full border border-black/5 bg-white/95 px-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <Link
            href="/"
            className={cn(
              "inline-flex flex-col items-center gap-0.5 text-[10px]",
              isHome ? "text-foreground" : "text-muted-foreground"
            )}
            aria-label="Home"
          >
            <Home className="size-5 stroke-[1.6]" />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              setSearchOpen(true);
            }}
            className="inline-flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground"
            aria-label="Search"
          >
            <Search className="size-5 stroke-[1.6]" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              setCartOpen(true);
            }}
            className="relative inline-flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground"
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

          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setProfileOpen((value) => !value);
            }}
            className={cn(
              "inline-flex flex-col items-center gap-0.5 text-[10px]",
              profileOpen ? "text-foreground" : "text-muted-foreground"
            )}
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            <User className="size-5 stroke-[1.6]" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {profileOpen ? (
        <div className="fixed inset-0 z-[55] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close profile"
            onClick={() => setProfileOpen(false)}
          />
          <div className="absolute inset-x-4 bottom-[5.25rem] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
            {accountLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5 text-[14px] last:border-b-0"
                >
                  <Icon className="size-4 stroke-[1.5] text-muted-foreground" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="fixed inset-0 z-[70] bg-white md:hidden">
          <form onSubmit={submitSearch} className="flex h-14 items-center gap-3 border-b border-black/8 px-4">
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
