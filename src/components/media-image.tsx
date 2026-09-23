import Image from "next/image";
import { cn } from "cn";

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  fit?: "contain" | "cover";
};

export function MediaImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority,
  fill = false,
  fit = "contain",
}: MediaImageProps) {
  const unoptimized =
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/media/") ||
    src.startsWith("http://") ||
    src.startsWith("https://");

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={cn(
          fit === "cover" ? "object-cover" : "object-contain",
          className
        )}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={1600}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
