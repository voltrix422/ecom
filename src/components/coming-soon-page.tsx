"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import LightRays from "@/components/light-rays";
import { brand } from "@/lib/data";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        already?: boolean;
      } | null;
      if (!response.ok) {
        setStatus("error");
        setMessage(data?.error || "Something went wrong");
        return;
      }
      setStatus("done");
      setMessage(
        data?.already
          ? "You’re already on the list."
          : "We’ll email you when we launch."
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  return (
    <main className="coming-soon fixed inset-0 overflow-hidden text-center">
      <div className="coming-soon-glow absolute inset-0 z-0" aria-hidden />
      <div className="absolute inset-0 z-[1]" aria-hidden>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.15}
          lightSpread={0.7}
          rayLength={2.8}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1.2}
          saturation={1}
          className="custom-rays"
        />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-center px-5 pt-[16svh] sm:justify-center sm:pt-0">
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
                if (status !== "idle" && status !== "loading") setStatus("idle");
              }}
              className="h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 text-[14px] text-white outline-none placeholder:text-white/45 backdrop-blur-sm focus:border-white/45"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "done"}
              className="font-nav-display h-12 w-full rounded-full bg-white px-6 text-[12px] tracking-wide text-black transition-opacity disabled:opacity-60"
            >
              {status === "loading"
                ? "Saving…"
                : status === "done"
                  ? "Saved"
                  : "Notify me"}
            </button>
          </form>

          {message ? (
            <p
              className={`mt-3 text-[13px] normal-case ${
                status === "error" ? "text-red-300" : "text-white/70"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
