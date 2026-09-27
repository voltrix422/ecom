"use client";

import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { brand } from "@/lib/data";

const Silk = dynamic(() => import("@/components/silk"), { ssr: false });

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlBg: html.style.background,
      htmlH: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyBg: body.style.background,
      bodyH: body.style.height,
      bodyMinH: body.style.minHeight,
    };
    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.background = "#12081f";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.minHeight = "100%";
    body.style.background = "#12081f";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.background = prev.htmlBg;
      html.style.height = prev.htmlH;
      body.style.overflow = prev.bodyOverflow;
      body.style.background = prev.bodyBg;
      body.style.height = prev.bodyH;
      body.style.minHeight = prev.bodyMinH;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "loading" || status === "done") return;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        setStatus("error");
        setError(data?.error || "Something went wrong");
        return;
      }
      window.dispatchEvent(new CustomEvent("aw:feature", { detail: "notify_me" }));
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong");
    }
  }

  return (
    <main className="coming-soon fixed inset-0 z-[100] h-[100dvh] w-screen max-w-[100vw] overflow-hidden text-center">
      <div className="absolute inset-0 z-0 h-full w-full bg-[#12081f]" aria-hidden>
        <Silk
          speed={5}
          scale={1}
          color="#5227FF"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex w-full max-w-md flex-col items-center">
          <Image
            src={brand.wordmark}
            alt={brand.name}
            width={280}
            height={64}
            className="h-12 w-auto object-contain brightness-0 invert sm:h-14"
            priority
            unoptimized
          />

          <h1 className="coming-soon-title mt-5 whitespace-nowrap font-nav-display text-[clamp(2.1rem,10.5vw,4.25rem)] leading-none tracking-tight text-white sm:mt-8">
            Coming soon
          </h1>

          {status === "done" ? (
            <p className="mt-6 text-[15px] leading-relaxed text-white/85 normal-case">
              We’ll notify you at launch.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8"
            >
              <label className="sr-only" htmlFor="notify-email">
                Email
              </label>
              <input
                id="notify-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="Email to notify me"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setError("");
                  }
                }}
                className="h-12 w-full rounded-full border border-white/25 bg-black/25 px-5 text-[14px] text-white outline-none placeholder:text-white/50 backdrop-blur-sm focus:border-white/50"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="font-nav-display h-12 w-full rounded-full bg-white px-6 text-[12px] tracking-wide text-black transition-opacity disabled:opacity-60"
              >
                {status === "loading" ? "Saving…" : "Notify me"}
              </button>
              {status === "error" && error ? (
                <p className="text-[13px] text-red-200 normal-case">{error}</p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
