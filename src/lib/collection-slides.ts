import type { CollectionSlide, Product } from "@/lib/types";
import { storePath } from "@/lib/site-mode";

export const DEFAULT_COLLECTION_SLIDES: CollectionSlide[] = [
  {
    id: "collection-seed-lawn",
    src: "/products/suit-ivory-garden.png",
    caption: "Lawn",
    href: `${storePath("/shop")}?category=Lawn`,
  },
  {
    id: "collection-seed-chiffon",
    src: "/products/suit-midnight.png",
    caption: "Chiffon",
    href: `${storePath("/shop")}?category=Chiffon`,
  },
  {
    id: "collection-seed-khaddar",
    src: "/products/suit-dust-rose.png",
    caption: "Khaddar",
    href: `${storePath("/shop")}?category=Khaddar`,
  },
];

export function usableCollectionSlides(slides: CollectionSlide[]) {
  return slides.filter(
    (slide) =>
      slide?.id &&
      typeof slide.src === "string" &&
      slide.src.length > 0 &&
      !slide.src.startsWith("data:image/webp")
  );
}

/** Prefer saved slides; if none left after deletes, rebuild from live products. */
export function resolveCollectionSlides(
  slides: CollectionSlide[] | null | undefined,
  products: Product[] = []
): CollectionSlide[] {
  const usable = usableCollectionSlides(slides ?? []);
  if (usable.length >= 2) return usable;

  const fromProducts: CollectionSlide[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    const src = product.image || product.images?.[0];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    fromProducts.push({
      id: `collection-auto-${product.id}`,
      src,
      caption: product.category || product.name,
      href: storePath(`/product/${product.slug}`),
    });
    if (fromProducts.length >= 6) break;
  }
  if (fromProducts.length >= 2) return fromProducts;
  if (usable.length === 1 && fromProducts.length === 1) {
    return [...usable, fromProducts[0]];
  }
  if (usable.length === 1) return usable;
  return DEFAULT_COLLECTION_SLIDES;
}
