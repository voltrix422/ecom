import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { brand } from "@/lib/data";

/** Logo asset aspect after trim (w/h) */
const LOGO_RATIO = 357 / 606;

const sizes = {
  sm: { height: 36, word: "text-xl", gap: "gap-1" },
  md: { height: 46, word: "text-2xl", gap: "gap-1" },
  lg: { height: 58, word: "text-3xl", gap: "gap-1.5" },
  xl: { height: 92, word: "text-5xl", gap: "gap-1.5" },
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizes;
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function BrandLogo({
  size = "md",
  href = "/",
  showWordmark = true,
  className,
  markClassName,
  wordmarkClassName,
}: BrandLogoProps) {
  const s = sizes[size];
  const width = Math.round(s.height * LOGO_RATIO);

  const content = (
    <>
      <span
        className={cn("relative inline-flex shrink-0", markClassName)}
        style={{ width, height: s.height }}
      >
        <Image
          src={brand.logo}
          alt=""
          width={width}
          height={s.height}
          className="size-full object-contain object-center"
          loading="eager"
          unoptimized
        />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "font-heading leading-none tracking-tight",
            s.word,
            wordmarkClassName
          )}
        >
          {brand.name}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "inline-flex items-center text-foreground",
    s.gap,
    className
  );

  if (href === null) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes} aria-label={brand.name}>
      {content}
    </Link>
  );
}

export function BrandWordmark({
  href = "/",
  className,
}: {
  href?: string | null;
  className?: string;
}) {
  const word = (
    <span
      className={cn(
        "font-heading text-[1.7rem] leading-none tracking-[0.06em] text-[#2b1c1f]",
        className
      )}
    >
      {brand.name}
    </span>
  );

  if (href === null) return word;

  return (
    <Link href={href} className="inline-flex items-center" aria-label={brand.name}>
      {word}
    </Link>
  );
}
