import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { brand } from "@/lib/data";

/** Lockup artwork aspect after trim (w/h) */
const LOCKUP_RATIO = 384 / 446;

type BrandArcLogoProps = {
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  size?: number;
  href?: string | null;
  className?: string;
};

export function BrandArcLogo({
  size = 96,
  href = "/",
  className,
}: BrandArcLogoProps) {
  const height = size;
  const width = Math.round(height * LOCKUP_RATIO);

  const content = (
    /*
      Served unoptimized: the optimizer re-encodes brand art onto a square
      canvas, which makes `object-contain` shrink it well below its box.
    */
    <Image
      src={brand.lockup}
      alt={brand.name}
      width={width}
      height={height}
      className="size-full object-contain object-center"
      loading="eager"
      unoptimized
    />
  );

  const classes = cn("inline-block shrink-0", className);

  if (href === null) {
    return (
      <span className={classes} style={{ width, height }}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} style={{ width, height }}>
      {content}
    </Link>
  );
}
