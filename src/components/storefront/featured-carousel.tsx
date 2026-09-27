"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { cn } from "cn";

export type FeaturedCarouselItem = {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  href: string;
};

export function FeaturedCarousel({
  items,
  autoplay = true,
  interval = 4,
}: {
  items: FeaturedCarouselItem[];
  autoplay?: boolean;
  interval?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number(visible.target.getAttribute("data-index") || 0);
        setActive(index);
      },
      {
        root,
        threshold: [0.45, 0.6, 0.75],
      }
    );

    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!autoplay || paused || items.length < 2) return;
    const id = window.setInterval(() => {
      const root = scrollerRef.current;
      if (!root) return;
      const next = (active + 1) % items.length;
      const card = root.querySelector<HTMLElement>(`[data-index="${next}"]`);
      card?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, Math.max(interval, 2) * 1000);
    return () => window.clearInterval(id);
  }, [active, autoplay, interval, items.length, paused]);

  if (!items.length) return null;

  const current = items[active] ?? items[0];

  return (
    <div
      className="font-nav-display relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-background md:h-14"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% 55%, 88% 78%, 72% 52%, 55% 86%, 38% 48%, 22% 82%, 8% 58%, 0 72%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-16 z-[1] h-12 bg-background md:bottom-20 md:h-16"
        style={{
          clipPath:
            "polygon(0 100%, 100% 100%, 100% 28%, 90% 62%, 74% 22%, 58% 70%, 42% 18%, 26% 66%, 10% 30%, 0 58%)",
        }}
        aria-hidden
      />

      <div
        ref={scrollerRef}
        className="featured-carousel-scroller flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[12vw] pb-4 pt-8 md:gap-6 md:px-[18vw] md:pt-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, index) => (
          <Link
            key={`${item.href}-${index}`}
            href={item.href}
            data-card
            data-index={index}
            className={cn(
              "group relative w-[58vw] max-w-[320px] shrink-0 snap-center transition-opacity duration-500 sm:w-[42vw] md:w-[28vw] md:max-w-[380px]",
              index === active ? "opacity-100" : "opacity-55 hover:opacity-85"
            )}
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/20">
              <MediaImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 768px) 28vw, 58vw"
                className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="relative z-[2] mt-2 min-h-[4.5rem] px-6 text-center md:mt-3">
        <p
          key={current.href}
          className="featured-carousel-caption text-[18px] tracking-tight text-foreground md:text-[22px]"
        >
          {current.title}
        </p>
        {current.subtitle ? (
          <p className="mt-1.5 text-[12px] tracking-wide text-muted-foreground md:text-[13px]">
            {current.subtitle}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={`${item.href}-dot-${index}`}
              type="button"
              aria-label={`Show ${item.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === active
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
              )}
              onClick={() => {
                const root = scrollerRef.current;
                const card = root?.querySelector<HTMLElement>(
                  `[data-index="${index}"]`
                );
                card?.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
