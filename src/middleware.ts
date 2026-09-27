import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COMING_SOON } from "@/lib/site-mode";

const PASSTHROUGH = [
  "/api",
  "/admin",
  "/media",
  "/_next",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/brand",
  "/products",
  "/robots",
  "/sitemap",
];

const STORE_ROOTS = [
  "/shop",
  "/product",
  "/cart",
  "/checkout",
  "/about",
  "/help",
  "/track",
];

function isPassthrough(pathname: string) {
  return PASSTHROUGH.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isStorefront(pathname: string) {
  return STORE_ROOTS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  if (!COMING_SOON) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (isPassthrough(pathname)) return NextResponse.next();

  // Public root is the coming-soon page
  if (pathname === "/") return NextResponse.next();

  // /main → store home page; /main/shop → rewrite to /shop, etc.
  if (pathname === "/main" || pathname === "/main/") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/main/")) {
    const rest = pathname.slice("/main".length) || "/";
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.rewrite(url);
  }

  // Bare storefront URLs → /main/...
  if (isStorefront(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/main${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt)$).*)"],
};
