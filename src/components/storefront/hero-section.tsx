"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usableHeroBanners } from "@/lib/hero-storage";
import { flashPageVeil } from "@/components/page-veil";
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
    <section className="relative isolate -mt-16 h-dvh max-h-dvh overflow-hidden bg-[#e8e2da]">
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

      <div className="absolute inset-x-0 bottom-[12%] z-10 flex items-center justify-center gap-1.5 px-6">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            onClick={() => flashPageVeil()}
            className="group relative inline-flex h-12 min-w-[9rem] items-center justify-center overflow-hidden rounded-md border-0 bg-black/45 px-6 text-[15px] font-nav-display text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-100 sm:h-[3.25rem] sm:text-[16px]"
          >
            <span className="absolute inset-x-0 bottom-0 h-0 bg-white transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-full" />
            <span className="relative font-nav-display transition-colors duration-500 ease-out group-hover:text-black">
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
