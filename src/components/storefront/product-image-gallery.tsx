"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { cn } from "cn";

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
  const [zoomOpen, setZoomOpen] = useState(false);
  const count = images.length;
  const index = Math.min(Math.max(activeIndex, 0), Math.max(count - 1, 0));
  const src = images[index] || images[0] || "";

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      onChange((next + count) % count);
    },
    [count, onChange]
  );

  const touchStartX = useRef<number | null>(null);

  function onTouchStart(event: ReactTouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (touchStartX.current == null || count <= 1) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? index + 1 : index - 1);
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={galleryRef}
        className={cn(
          "group relative min-h-0 w-full overflow-hidden bg-white",
          imageClassName
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-zoom-in"
          aria-label="Zoom image"
          onClick={() => setZoomOpen(true)}
        >
          <MediaImage
            src={src}
            alt={alt}
            fill
            priority
            fit={fit}
            sizes={sizes}
          />
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
              className="absolute top-1/2 left-1 z-10 flex size-9 -translate-y-1/2 items-center justify-center bg-white/80 text-foreground opacity-90 shadow-sm backdrop-blur-sm transition hover:bg-white md:left-2 md:size-10 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                go(index + 1);
              }}
              className="absolute top-1/2 right-1 z-10 flex size-9 -translate-y-1/2 items-center justify-center bg-white/80 text-foreground opacity-90 shadow-sm backdrop-blur-sm transition hover:bg-white md:right-2 md:size-10 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" strokeWidth={1.6} />
            </button>
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-1 rounded-full transition-colors",
                    i === index ? "bg-foreground" : "bg-foreground/25"
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          aria-label="Zoom image"
          onClick={() => setZoomOpen(true)}
          className="absolute right-2 bottom-2 z-10 flex size-8 items-center justify-center bg-white/85 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"
        >
          <ZoomIn className="size-4" strokeWidth={1.7} />
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
              key={`${image.slice(0, 32)}-${i}`}
              type="button"
              onClick={() => onChange(i)}
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

      {zoomOpen ? (
        <ImageZoomLightbox
          images={images}
          alt={alt}
          index={index}
          onIndexChange={onChange}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ImageZoomLightbox({
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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      onIndexChange((next + count) % count);
      resetView();
    },
    [count, onIndexChange, resetView]
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

  function onWheel(event: ReactWheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    setScale((current) => {
      const next = Math.min(4, Math.max(1, current + delta));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.current.originX + (event.clientX - drag.current.startX),
      y: drag.current.originY + (event.clientY - drag.current.startY),
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function toggleZoom() {
    if (scale > 1) {
      resetView();
      return;
    }
    setScale(2.2);
  }

  const touchX = useRef<number | null>(null);

  function onTouchStart(event: ReactTouchEvent) {
    if (scale > 1) return;
    touchX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (touchX.current == null || scale > 1 || count <= 1) return;
    const endX = event.changedTouches[0]?.clientX ?? touchX.current;
    const delta = endX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 50) return;
    go(delta < 0 ? index + 1 : index - 1);
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col bg-black/92 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed product image"
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <p className="text-xs tracking-wide text-white/70 tabular-nums">
          {index + 1} / {count}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleZoom}
            className="inline-flex size-10 items-center justify-center text-white/85 hover:text-white"
            aria-label={scale > 1 ? "Reset zoom" : "Zoom in"}
          >
            <ZoomIn className="size-5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center text-white/85 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={toggleZoom}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        >
          {/* Zoom uses a plain img so pinch/pan stays smooth */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
          />
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ChevronLeft className="size-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ChevronRight className="size-6" strokeWidth={1.5} />
            </button>
          </>
        ) : null}
      </div>

      <p className="shrink-0 px-4 py-3 text-center text-[11px] text-white/55">
        Swipe or arrows to change · pinch scroll / double-tap to zoom · drag when
        zoomed
      </p>
    </div>
  );
}
