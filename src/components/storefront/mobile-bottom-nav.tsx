"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Home, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { brand } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const pillClass =
  "pointer-events-auto inline-flex h-11 min-w-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-black/[0.06] bg-white px-2 text-[10px] font-semibold tracking-tight text-black shadow-[0_6px_20px_rgba(0,0,0,0.1)]";

const iconClass = "size-[17px] stroke-[2.25]";

type SearchPhase = "idle" | "expanded" | "typing";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartOpen } = useStore();
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const open = phase !== "idle";
  const typing = phase === "typing";
  const isHome = pathname === "/";
  // Home: always show notch. Other pages: show after a little scroll down.
  const hideNotch = cartOpen || sidebarOpen || (!isHome && !scrolled);

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
    function onScroll() {
      setScrolled(window.scrollY > 18);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

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

  return (
    <nav
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex items-end justify-center gap-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
        hideNotch
          ? "pointer-events-none translate-y-4 opacity-0 [&_a]:pointer-events-none [&_button]:pointer-events-none [&_form]:pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
      aria-label="Mobile"
      aria-hidden={hideNotch}
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

      <a
        href={`https://wa.me/${brand.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          pillClass,
          "text-[#128C7E] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "translate-x-2"
        )}
        aria-label="Chat on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[17px]"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.742.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>Chat</span>
      </a>
    </nav>
  );
}
