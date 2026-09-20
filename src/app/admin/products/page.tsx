"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, GripVertical, Search, Star } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "cn";

type StockFilter = "all" | "in-stock" | "low" | "out";
type FeaturedFilter = "all" | "featured" | "not-featured";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-left text-[11px] tracking-[0.12em] uppercase",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {title}
        </span>
        <span className="flex min-w-0 items-center gap-1">
          {!open ? (
            <span className="truncate text-[11px] text-muted-foreground">
              {summary}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>
      {open ? (
        <div className="mt-1 flex flex-row flex-wrap gap-0.5 lg:flex-col lg:flex-nowrap">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  const { products, canEdit, categories, reorderProducts } = useStore();
  const editable = canEdit();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stock, setStock] = useState<StockFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [open, setOpen] = useState({
    category: false,
    stock: false,
    featured: false,
  });

  function toggleGroup(group: "category" | "stock" | "featured") {
    setOpen((current) => ({ ...current, [group]: !current[group] }));
  }

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchQuery =
        !query ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.color.toLowerCase().includes(query.toLowerCase());
      const matchCategory = category === "All" || product.category === category;
      const matchStock =
        stock === "all" ||
        (stock === "in-stock" && product.stock > 10) ||
        (stock === "low" && product.stock > 0 && product.stock <= 10) ||
        (stock === "out" && product.stock <= 0);
      const matchFeatured =
        featured === "all" ||
        (featured === "featured" && product.featured) ||
        (featured === "not-featured" && !product.featured);
      return matchQuery && matchCategory && matchStock && matchFeatured;
    });
  }, [products, query, category, stock, featured]);

  const hasFilters =
    category !== "All" || stock !== "all" || featured !== "all";

  const positionById = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product, index) => {
      map.set(product.id, index + 1);
    });
    return map;
  }, [products]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-8 rounded-none border-0 border-b border-border/60 pl-8 shadow-none focus-visible:ring-0"
          />
        </div>
        {editable ? (
          <Button asChild className="h-8 rounded-none">
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[140px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <FilterGroup
            title="Category"
            summary={category}
            open={open.category}
            onToggle={() => toggleGroup("category")}
          >
            {["All", ...categories].map((item) => (
              <FilterButton
                key={item}
                active={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup
            title="Stock"
            summary={
              stock === "all"
                ? "All stock"
                : stock === "in-stock"
                  ? "In stock"
                  : stock === "low"
                    ? "Low"
                    : "Out"
            }
            open={open.stock}
            onToggle={() => toggleGroup("stock")}
          >
            {(
              [
                ["all", "All stock"],
                ["in-stock", "In stock"],
                ["low", "Low"],
                ["out", "Out"],
              ] as const
            ).map(([value, label]) => (
              <FilterButton
                key={value}
                active={stock === value}
                onClick={() => setStock(value)}
              >
                {label}
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup
            title="Featured"
            summary={
              featured === "all"
                ? "All"
                : featured === "featured"
                  ? "Featured"
                  : "Not featured"
            }
            open={open.featured}
            onToggle={() => toggleGroup("featured")}
          >
            {(
              [
                ["all", "All"],
                ["featured", "Featured"],
                ["not-featured", "Not featured"],
              ] as const
            ).map(([value, label]) => (
              <FilterButton
                key={value}
                active={featured === value}
                onClick={() => setFeatured(value)}
              >
                {label}
              </FilterButton>
            ))}
          </FilterGroup>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setCategory("All");
                setStock("all");
                setFeatured("all");
              }}
              className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </aside>

        <div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products match.</p>
          ) : (
            <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((product) => {
                const position = positionById.get(product.id) ?? 0;
                const isDragging = draggingId === product.id;
                const isOver =
                  overId === product.id &&
                  draggingId !== null &&
                  draggingId !== product.id;

                return (
                  <article
                    key={product.id}
                    draggable={editable}
                    onDragStart={(event) => {
                      if (!editable) return;
                      setDraggingId(product.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", product.id);
                    }}
                    onDragOver={(event) => {
                      if (!editable || !draggingId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (overId !== product.id) setOverId(product.id);
                    }}
                    onDragLeave={() => {
                      if (overId === product.id) setOverId(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const activeId =
                        event.dataTransfer.getData("text/plain") || draggingId;
                      if (activeId) reorderProducts(activeId, product.id);
                      setDraggingId(null);
                      setOverId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverId(null);
                    }}
                    className={cn(
                      "group relative",
                      editable && "cursor-grab active:cursor-grabbing",
                      isDragging && "opacity-40",
                      isOver && "ring-1 ring-foreground/40"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] tracking-[0.14em] text-muted-foreground tabular-nums">
                        {position}
                      </span>
                      {editable ? (
                        <span className="text-muted-foreground" aria-hidden>
                          <GripVertical className="size-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={
                        editable
                          ? `/admin/products/${product.id}`
                          : `/product/${product.slug}`
                      }
                      className="relative block aspect-[3/4]"
                      onClick={(event) => {
                        if (draggingId) event.preventDefault();
                      }}
                      draggable={false}
                    >
                      <MediaImage
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1536px) 14vw, (min-width: 1280px) 18vw, (min-width: 768px) 28vw, 50vw"
                        className="pointer-events-none object-contain transition-opacity group-hover:opacity-80"
                      />
                    </Link>
                    <div className="mt-3 space-y-1">
                      <p className="flex items-start gap-1.5 text-[13px] leading-snug">
                        <span className="min-w-0 flex-1">{product.name}</span>
                        {product.featured ? (
                          <Star
                            className="mt-0.5 size-3.5 shrink-0 fill-foreground text-foreground"
                            aria-label="Featured"
                          />
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
