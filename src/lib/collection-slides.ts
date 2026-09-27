import type { CollectionSlide } from "@/lib/types";

export const DEFAULT_COLLECTION_SLIDES: CollectionSlide[] = [
  {
    id: "collection-seed-lawn",
    src: "/products/suit-ivory-garden.png",
    caption: "Lawn",
    href: "/shop?category=Lawn",
  },
  {
    id: "collection-seed-chiffon",
    src: "/products/suit-midnight.png",
    caption: "Chiffon",
    href: "/shop?category=Chiffon",
  },
  {
    id: "collection-seed-khaddar",
    src: "/products/suit-dust-rose.png",
    caption: "Khaddar",
    href: "/shop?category=Khaddar",
  },
];

export function usableCollectionSlides(slides: CollectionSlide[]) {
  return slides.filter(
    (slide) => slide?.id && slide.src && !slide.src.startsWith("data:image/webp")
  );
}
