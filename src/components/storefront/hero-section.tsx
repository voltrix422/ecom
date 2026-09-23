"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usableHeroBanners } from "@/lib/hero-storage";
import { useStore } from "@/lib/store";
import { cn } from "cn";

const actions = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=Lawn", label: "Lawn" },
];

export function HeroSection() {
  const { heroBanners, ready } = useStore();
  const slides = usableHeroBanners(heroBanners);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, 8000);
    return () => window.clearInterval(id);
  }, [count]);

  const safeIndex = count ? index % count : 0;

  return (
    <section className="relative isolate -mt-16 h-[calc(100dvh-var(--announce-h,40px))] max-h-[calc(100dvh-var(--announce-h,40px))] overflow-hidden bg-[#e8e2da]">
      {ready && count > 0
        ? slides.map((slide, slideIndex) => (
            <img
              key={slide.id}
              src={slide.src}
              alt=""
              draggable={false}
              decoding="sync"
              fetchPriority={slideIndex === 0 ? "high" : "low"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out",
                slideIndex === safeIndex ? "opacity-100" : "opacity-0"
              )}
            />
          ))
        : null}

      <div className="absolute inset-x-0 bottom-[12%] z-10 flex items-center justify-center gap-3 px-6">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group relative inline-flex h-12 min-w-[9.5rem] items-center justify-center overflow-hidden border border-white bg-white px-7 text-[11px] tracking-[0.24em] text-black uppercase"
          >
            <span className="absolute inset-y-0 left-0 w-0 bg-black transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
            <span className="relative transition-colors duration-500 ease-out group-hover:text-white">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {count > 1 ? (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show banner ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                slideIndex === safeIndex ? "bg-white" : "bg-white/45"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
