"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreShell } from "@/components/storefront/store-shell";
import { Input } from "@/components/ui/input";
import { categories as seedCategories } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { cn } from "cn";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, categories } = useStore();
  const allCategories = categories.length ? categories : [...seedCategories];
  const initial = (searchParams.get("category") as Category | null) ?? "All";
  const [category, setCategory] = useState<Category | "All">(
    allCategories.includes(initial) ? initial : "All"
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const next = searchParams.get("category") as Category | null;
    if (next && allCategories.includes(next)) {
      setCategory(next);
    } else if (!next) {
      setCategory("All");
    }
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams, allCategories]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "All" || product.category === category;
      const matchQuery =
        !query ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [category, products, query]);

  const hasFilters = category !== "All" || query.length > 0;

  function selectCategory(item: Category | "All") {
    setCategory(item);
    const q = searchParams.get("q");
    if (item === "All") {
      router.replace(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop", {
        scroll: false,
      });
    } else {
      const params = new URLSearchParams();
      params.set("category", item);
      if (q) params.set("q", q);
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    }
  }

  function clearFilters() {
    setCategory("All");
    setQuery("");
    router.replace("/shop", { scroll: false });
  }

  function renderFilters(className?: string) {
    return (["All", ...allCategories] as const).map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => selectCategory(item)}
        className={cn(
          "font-nav-display shrink-0 cursor-pointer px-3 py-1.5 text-[14px] transition-colors sm:text-[15px] lg:w-full lg:px-2.5 lg:py-2 lg:text-left lg:text-[16px] xl:text-[17px]",
          category === item
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
      >
        {item}
      </button>
    ));
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 pt-4 pb-16 md:pt-6 md:pb-20">
        {/* Mobile: horizontal filter strip only (search is in bottom nav) */}
        <div className="mb-5 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Filter
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[11px] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" />
                Clear
              </button>
            ) : null}
          </div>
          <nav
            className="-mx-6 mt-3 flex gap-1.5 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Categories"
          >
            {renderFilters()}
          </nav>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="font-nav-display h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 pl-6 text-[13px] shadow-none focus-visible:border-foreground focus-visible:ring-0"
              />
            </div>

            <div className="mt-8 flex items-center justify-between gap-2">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Filter
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" />
                  Clear
                </button>
              ) : null}
            </div>

            <nav className="mt-4 flex flex-col gap-0" aria-label="Categories">
              {renderFilters()}
            </nav>
          </aside>

          <div>
            <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-black/8 pb-4">
              <p className="text-[12px] tracking-[0.12em] text-muted-foreground uppercase">
                {category === "All" ? "All pieces" : category}
              </p>
              <p className="text-[12px] tabular-nums text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">
                Nothing matches this view.
              </p>
            ) : (
              <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    badgeTone="soft"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
