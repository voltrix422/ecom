export const SALE_OFF = 0.5;

export function salePrice(value: number) {
  return Math.round(value * (1 - SALE_OFF));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Build a unique product slug from a name (or existing slug). */
export function uniqueProductSlug(
  value: string,
  taken: Iterable<string>,
  excludeSlug?: string
) {
  const used = new Set(
    [...taken].filter((slug) => slug && slug !== excludeSlug)
  );
  const base = slugify(value) || "product";
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Ensure every product has a distinct slug (repairs copy-pasted duplicates). */
export function ensureUniqueProductSlugs<T extends { id: string; slug: string; name: string }>(
  products: T[]
): { products: T[]; changed: boolean } {
  const seen = new Set<string>();
  let changed = false;
  const next = products.map((product) => {
    const base = slugify(product.slug || product.name) || slugify(product.id) || "product";
    let slug = base;
    let n = 2;
    while (seen.has(slug)) {
      slug = `${base}-${n++}`;
    }
    seen.add(slug);
    if (slug !== product.slug) {
      changed = true;
      return { ...product, slug };
    }
    return product;
  });
  return { products: next, changed };
}
