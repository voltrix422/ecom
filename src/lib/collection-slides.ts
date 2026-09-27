import type { CollectionSlide } from "@/lib/types";
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
    (slide) => slide?.id && slide.src && !slide.src.startsWith("data:image/webp")
  );
}
