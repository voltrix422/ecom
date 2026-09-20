"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const current = photos[index];
  const multiple = photos.length > 1;
  const prevPhoto = multiple
    ? photos[(index - 1 + photos.length) % photos.length]
    : null;
  const nextPhoto = multiple
    ? photos[(index + 1) % photos.length]
    : null;
  const startX = useRef<number | null>(null);

  function go(delta: number) {
    if (!multiple) return;
    onIndex((index + delta + photos.length) % photos.length);
  }

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, multiple, photos.length, onClose]);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
    >
      <button
        type="button"
        className="absolute inset-0 bg-white/55 backdrop-blur-xl"
        aria-label="Close"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 inline-flex size-11 items-center justify-center text-foreground"
        aria-label="Close"
      >
        <X className="size-6" strokeWidth={1.75} />
      </button>

      <div className="relative z-10 flex w-full items-center justify-center gap-3 px-2 md:gap-6 md:px-8">
        {prevPhoto ? (
          <button
            type="button"
            onClick={() => go(-1)}
            className="shrink-0"
            aria-label="Previous photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prevPhoto}
              alt="Previous"
              className="h-[30vh] w-12 object-cover opacity-45 transition-opacity hover:opacity-75 sm:h-[42vh] sm:w-auto sm:max-w-[18vw]"
            />
          </button>
        ) : null}

        {multiple ? (
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-1 z-20 inline-flex size-12 items-center justify-center text-foreground md:left-2"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-9" strokeWidth={1.75} />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`Proof ${index + 1}`}
          className="max-h-[86vh] max-w-[min(92vw,42rem)] object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            startX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (startX.current == null) return;
            const delta = event.clientX - startX.current;
            startX.current = null;
            if (delta > 40) go(-1);
            if (delta < -40) go(1);
          }}
        />

        {multiple ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-1 z-20 inline-flex size-12 items-center justify-center text-foreground md:right-2"
            aria-label="Next photo"
          >
            <ChevronRight className="size-9" strokeWidth={1.75} />
          </button>
        ) : null}

        {nextPhoto ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="shrink-0"
            aria-label="Next photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextPhoto}
              alt="Next"
              className="h-[30vh] w-12 object-cover opacity-45 transition-opacity hover:opacity-75 sm:h-[42vh] sm:w-auto sm:max-w-[18vw]"
            />
          </button>
        ) : null}
      </div>

      {multiple ? (
        <p className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-xs text-foreground/70">
          {index + 1} / {photos.length}
        </p>
      ) : null}
    </div>,
    document.body
  );
}
