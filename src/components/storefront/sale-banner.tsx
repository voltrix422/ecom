"use client";

import { useEffect, useState } from "react";

const SALE_KEY = "form-sale-end";
const SALE_MS = 7 * 24 * 60 * 60 * 1000;

function getEndTime() {
  if (typeof window === "undefined") return Date.now() + SALE_MS;
  const stored = window.localStorage.getItem(SALE_KEY);
  if (stored) {
    const value = Number(stored);
    if (!Number.isNaN(value)) return value;
  }
  const end = Date.now() + SALE_MS;
  window.localStorage.setItem(SALE_KEY, String(end));
  return end;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, done: total <= 0 };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function SaleItems({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-16 pr-16 text-[11px] tracking-[0.16em] text-white uppercase sm:text-xs">
      <span>Sale</span>
      <span>Flat 50% off</span>
      <span className="tabular-nums tracking-wider">{label}</span>
    </div>
  );
}

export function SaleBanner() {
  const [time, setTime] = useState({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: false,
  });

  useEffect(() => {
    const end = getEndTime();

    function tick() {
      setTime(parts(end - Date.now()));
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const label = time.done
    ? "Sale ended"
    : `Ends in 7 days · ${time.days}d ${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`;

  return (
    <div className="overflow-hidden bg-red-600 py-2 text-white">
      <div className="flex w-max animate-sale-marquee">
        <SaleItems label={label} />
        <SaleItems label={label} />
        <SaleItems label={label} />
        <SaleItems label={label} />
      </div>
    </div>
  );
}
