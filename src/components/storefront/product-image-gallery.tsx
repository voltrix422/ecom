"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { cn } from "cn";

const navBtn =
  "absolute top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center text-foreground/80 transition-colors duration-300 hover:text-foreground md:size-10";

const lightboxNavBtn =
  "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center text-white transition-opacity duration-300 hover:opacity-100 md:size-10";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
  imageClassName?: string;
  fit?: "contain" | "cover";
  sizes?: string;
  showThumbs?: boolean;
  thumbClassName?: string;
  galleryRef?: RefObject<HTMLDivElement | null>;
};

export function ProductImageGallery({
  images,
  alt,
  activeIndex,
  onChange,
  className,
  imageClassName,
  fit = "contain",
  sizes = "100vw",
  showThumbs = true,
  thumbClassName,
  galleryRef,
}: ProductImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lensOn, setLensOn] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const count = images.length;
  const index = Math.min(Math.max(activeIndex, 0), Math.max(count - 1, 0));
  const src = images[index] || images[0] || "";

  useEffect(() => {
    if (activeIndex > count - 1) onChange(Math.max(0, count - 1));
  }, [activeIndex, count, onChange]);

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      const resolved = (next + count) % count;
      onChange(resolved);
      setFadeKey((value) => value + 1);
      setLensOn(false);
    },
    [count, onChange]
  );

  const touchStartX = useRef<number | null>(null);

  function onTouchStart(event: ReactTouchEvent) {
    if (lensOn) return;
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (touchStartX.current == null || count <= 1 || lensOn) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? index + 1 : index - 1);
  }

  function updateOrigin(clientX: number, clientY: number) {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  function onStageMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!lensOn) return;
    updateOrigin(event.clientX, event.clientY);
  }

  function setStageNode(node: HTMLDivElement | null) {
    stageRef.current = node;
    if (galleryRef) {
      (galleryRef as { current: HTMLDivElement | null }).current = node;
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={setStageNode}
        className={cn(
          "group relative min-h-0 w-full overflow-hidden bg-white",
          imageClassName
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseMove={onStageMove}
        onMouseLeave={() => {
          if (lensOn) setOrigin({ x: 50, y: 50 });
        }}
      >
        <button
          type="button"
          key={`${src}-${fadeKey}`}
          className={cn(
            "absolute inset-0 z-0 animate-gallery-fade",
            lensOn ? "cursor-crosshair" : "cursor-zoom-in"
          )}
          aria-label="Open full image"
          onClick={() => setLightboxOpen(true)}
        >
          <span
            className="absolute inset-0 block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={
              lensOn
                ? {
                    transform: "scale(2)",
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                  }
                : undefined
            }
          >
            <MediaImage
              src={src}
              alt={alt}
              fill
              priority
              fit={fit}
              sizes={sizes}
            />
          </span>
        </button>

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                go(index - 1);
              }}
              className={cn(navBtn, "left-3 md:left-4")}
            >
              <ChevronLeft className="size-6 md:size-7" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                go(index + 1);
              }}
              className={cn(navBtn, "right-3 md:right-4")}
            >
              <ChevronRight className="size-6 md:size-7" strokeWidth={2.5} />
            </button>
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-1 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    i === index ? "w-2.5 bg-foreground/70" : "bg-foreground/20"
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          aria-label={lensOn ? "Turn off hover zoom" : "Hover zoom"}
          aria-pressed={lensOn}
          onClick={(event) => {
            event.stopPropagation();
            setLensOn((value) => !value);
          }}
          className={cn(
            "absolute top-2 right-2 z-20 flex size-7 items-center justify-center text-foreground/45 transition-colors duration-300 hover:text-foreground md:size-8",
            lensOn && "text-foreground"
          )}
        >
          <ZoomIn className="size-3.5" strokeWidth={1.35} />
        </button>
      </div>

      {showThumbs && count > 1 ? (
        <div
          className={cn(
            "mt-0 flex gap-1.5 overflow-x-auto px-3 pt-0.5 md:mt-4 md:gap-3 md:px-0",
            thumbClassName
          )}
        >
          {images.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              onClick={() => {
                onChange(i);
                setFadeKey((value) => value + 1);
                setLensOn(false);
              }}
              className={cn(
                "relative h-9 w-6 shrink-0 overflow-hidden rounded-sm border md:h-20 md:w-16 md:rounded-none",
                i === index
                  ? "border-foreground"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <MediaImage
                src={image}
                alt={`${alt} ${i + 1}`}
                fill
                fit="cover"
                sizes="64px"
                className="md:object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <ImageLightbox
          images={images}
          alt={alt}
          index={index}
          onIndexChange={(next) => {
            onChange(next);
            setFadeKey((value) => value + 1);
          }}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ImageLightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const src = images[index] || "";
  const [fadeKey, setFadeKey] = useState(0);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      onIndexChange((next + count) % count);
      setFadeKey((value) => value + 1);
    },
    [count, onIndexChange]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, index, onClose]);

  function onTouchStart(event: ReactTouchEvent) {
    touchX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (touchX.current == null || count <= 1) return;
    const endX = event.changedTouches[0]?.clientX ?? touchX.current;
    const delta = endX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 50) return;
    go(delta < 0 ? index + 1 : index - 1);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] w-screen items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Full product image"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Covers page + sticky navbar */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30" />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-20 flex size-9 items-center justify-center text-white/70 transition-colors duration-300 hover:text-white"
        aria-label="Close"
      >
        <X className="size-5" strokeWidth={2} />
      </button>

      <p className="pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-20 -translate-x-1/2 text-[11px] tracking-wide text-white/60 tabular-nums">
        {index + 1} / {count}
      </p>

      <div
        key={`${src}-${fadeKey}`}
        className="relative z-10 mx-auto flex max-h-[min(88dvh,920px)] max-w-[min(92vw,820px)] items-center justify-center animate-gallery-fade"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[min(88dvh,920px)] max-w-[min(92vw,820px)] select-none object-contain"
        />

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                go(index - 1);
              }}
              className={cn(lightboxNavBtn, "left-2 opacity-80 md:left-3")}
            >
              <ChevronLeft className="size-6 md:size-7" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                go(index + 1);
              }}
              className={cn(lightboxNavBtn, "right-2 opacity-80 md:right-3")}
            >
              <ChevronRight className="size-6 md:size-7" strokeWidth={2.5} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
