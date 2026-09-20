import Link from "next/link";
import { brand } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <Link
          href="/"
          className="font-heading text-3xl leading-none tracking-tight"
        >
          {brand.name}
        </Link>
        <nav className="mt-6 flex flex-row flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/help" className="hover:text-foreground">
            Refund
          </Link>
          <Link href="/track" className="hover:text-foreground">
            Track
          </Link>
        </nav>
      </div>
    </footer>
  );
}
