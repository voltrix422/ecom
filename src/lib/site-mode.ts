/**
 * Flip to false when launching: `/` becomes the store again.
 * While true, public storefront lives under `/main`.
 */
export const COMING_SOON = true;

export const STORE_BASE = COMING_SOON ? "/main" : "";

/** Prefixed storefront href. Pass "/" or "/shop", etc. */
export function storePath(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (!STORE_BASE) return clean;
  if (clean === "/") return STORE_BASE;
  return `${STORE_BASE}${clean}`;
}

export function isStoreHomePath(pathname: string) {
  if (!COMING_SOON) return pathname === "/";
  return pathname === "/main" || pathname === "/main/";
}

/** Compare against the public storefront path (with /main prefix when coming soon). */
export function isStorePath(pathname: string, path: string) {
  return pathname === storePath(path);
}
