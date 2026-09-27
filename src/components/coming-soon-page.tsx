"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
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
    <main className="coming-soon relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="coming-soon-bg" aria-hidden>
        <span className="coming-soon-orb coming-soon-orb-a" />
        <span className="coming-soon-orb coming-soon-orb-b" />
        <span className="coming-soon-orb coming-soon-orb-c" />
        <span className="coming-soon-grain" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <Image
          src={brand.wordmark}
          alt={brand.name}
          width={220}
          height={48}
          className="h-9 w-auto object-contain brightness-0 invert sm:h-10"
          priority
          unoptimized
        />

        <h1 className="coming-soon-title mt-10 font-nav-display text-[clamp(2.75rem,12vw,4.5rem)] leading-[0.92] tracking-tight text-white">
          Coming soon
        </h1>
        <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/65 normal-case">
          Women’s unstitched suits — launching shortly. Leave your email and
          we’ll let you know.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch"
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
            className="h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-[14px] text-white outline-none placeholder:text-white/45 backdrop-blur-sm focus:border-white/45"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "done"}
            className="font-nav-display h-12 shrink-0 rounded-full bg-white px-6 text-[12px] tracking-wide text-black transition-opacity disabled:opacity-60"
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
    </main>
  );
}
