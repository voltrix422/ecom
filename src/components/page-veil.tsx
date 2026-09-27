"use client";

import { useEffect, useState } from "react";

type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();

export function flashPageVeil() {
  listeners.forEach((listen) => listen(true));
  window.setTimeout(() => {
    listeners.forEach((listen) => listen(false));
  }, 520);
}

export function PageVeil() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const listen: Listener = (next) => setActive(next);
    listeners.add(listen);
    return () => {
      listeners.delete(listen);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[80] bg-white transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
}
