"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { RotatingWord } from "@/components/storefront/rotating-word";
import { usableHeroBanners } from "@/lib/hero-storage";
import { useStore } from "@/lib/store";
import { cn } from "cn";

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
    <section className="relative isolate h-dvh min-h-dvh overflow-hidden bg-background">
      {ready && count > 0 ? (
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, #000 72%, rgba(0,0,0,0.82) 88%, rgba(0,0,0,0.45) 100%)",
            maskImage:
              "linear-gradient(to bottom, #000 0%, #000 72%, rgba(0,0,0,0.82) 88%, rgba(0,0,0,0.45) 100%)",
          }}
        >
          {slides.map((slide, slideIndex) => (
            <img
              key={slide.id}
              src={slide.src}
              alt=""
              draggable={false}
              decoding="sync"
              fetchPriority={slideIndex === 0 ? "high" : "low"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-[72%_center] transition-opacity duration-1000 ease-in-out",
                slideIndex === safeIndex ? "opacity-100" : "opacity-0"
              )}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7efe8]/70 via-[#f7efe8]/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#f7efe8]" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-background/80 via-background/25 to-transparent" />

      <div
        className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-center px-6 pb-10 text-left md:px-10"
        style={{ paddingTop: "var(--site-header-h, 8.25rem)" }}
      >
        <h1 className="font-heading text-5xl leading-[0.92] text-[#5c2a36] md:text-6xl lg:text-[4.6rem]">
          <span className="block whitespace-nowrap">Your fit.</span>
          <span className="block whitespace-nowrap">
            Your <RotatingWord />
          </span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-snug text-[#5c2a36]/80">
          <span className="block">Lawn, chiffon, khaddar and silk.</span>
          <span className="block text-[#5c2a36]/65">
            Cut for how you live. Stitched the way you want.
          </span>
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-sm bg-[#2b1c1f] px-7 text-sm text-white hover:bg-[#3d2a2f]"
        >
          Shop now
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {count > 1 ? (
        <div className="absolute right-6 bottom-28 z-10 flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-[#5c2a36]/70 md:right-12">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={cn(
                "border-b pb-0.5 transition-colors",
                slideIndex === safeIndex
                  ? "border-[#5c2a36] text-[#5c2a36]"
                  : "border-transparent hover:text-[#5c2a36]"
              )}
            >
              {String(slideIndex + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
