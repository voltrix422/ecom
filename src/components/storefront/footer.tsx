import Link from "next/link";
import { brand } from "@/lib/data";
import { storePath } from "@/lib/site-mode";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <Link href={storePath("/")} className="inline-flex" aria-label="Ayesha's">
          <img
            src={brand.wordmark}
            alt="Ayesha's"
            className="h-12 w-auto brightness-0"
          />
        </Link>
        <nav className="mt-6 flex flex-row flex-wrap items-center gap-x-5 gap-y-2 font-nav-display text-[14px] text-muted-foreground">
          <Link href={storePath("/shop")} className="hover:text-foreground">
            Shop
          </Link>
          <Link href={storePath("/about")} className="hover:text-foreground">
            About
          </Link>
          <Link href={storePath("/help")} className="hover:text-foreground">
            Refund
          </Link>
          <Link href={storePath("/track")} className="hover:text-foreground">
            Track
          </Link>
        </nav>
      </div>
    </footer>
  );
}
