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
    if (item === "All") {
      router.replace("/shop", { scroll: false });
    } else {
      router.replace(`/shop?category=${item}`, { scroll: false });
    }
  }

  function clearFilters() {
    setCategory("All");
    setQuery("");
    router.replace("/shop", { scroll: false });
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 pt-2 pb-14 md:pt-3">
        <h1 className="text-3xl md:text-4xl">Suits</h1>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative w-full max-w-[180px]">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-7 rounded-none border-border/70 pr-2 pl-7 text-xs"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                Filter
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex cursor-pointer items-center gap-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase hover:text-foreground"
                >
                  <X className="size-3" />
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-row flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap lg:gap-1">
              {(["All", ...allCategories] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectCategory(item)}
                  className={cn(
                    "cursor-pointer px-2 py-1.5 text-left text-[11px] tracking-[0.14em] uppercase transition-colors",
                    category === item
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No suits match this view.
              </p>
            ) : (
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
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
