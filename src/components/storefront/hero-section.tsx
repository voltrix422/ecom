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
    <section className="relative isolate h-dvh min-h-dvh overflow-hidden bg-[#e8e2da]">
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
                "absolute inset-0 h-full w-full object-cover object-[center_20%] transition-opacity duration-1000 ease-in-out",
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
            className="group relative inline-flex h-11 min-w-[8.5rem] items-center justify-center overflow-hidden bg-white px-6 text-[11px] tracking-[0.22em] text-black uppercase"
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
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
