"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { peekAdminSession } from "@/lib/store";

const VISITOR_KEY = "aw_vid";
const SESSION_KEY = "aw_sid";
const QUEUE: PixelPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

type PixelPayload = {
  visitorId: string;
  sessionId: string;
  type: "pageview" | "heartbeat" | "feature";
  path: string;
  feature?: string;
  durationMs?: number;
  referrer?: string;
  isAdmin?: boolean;
};

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `aw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readId(storage: Storage, key: string) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const next = randomId();
    storage.setItem(key, next);
    return next;
  } catch {
    return randomId();
  }
}

function ids() {
  return {
    visitorId: readId(window.localStorage, VISITOR_KEY),
    sessionId: readId(window.sessionStorage, SESSION_KEY),
  };
}

function shouldSkipPath(path: string) {
  return path.startsWith("/admin") || path.startsWith("/api");
}

function enqueue(event: Omit<PixelPayload, "visitorId" | "sessionId" | "isAdmin">) {
  if (typeof window === "undefined") return;
  if (shouldSkipPath(event.path)) return;
  const { visitorId, sessionId } = ids();
  QUEUE.push({
    ...event,
    visitorId,
    sessionId,
    isAdmin: peekAdminSession(),
    referrer: document.referrer || undefined,
  });
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 400);
}

async function flush() {
  if (!QUEUE.length) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  const body = JSON.stringify({ events: batch });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/pixel", blob);
      if (ok) return;
    }
    await fetch("/api/pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    QUEUE.unshift(...batch);
  }
}

export function trackFeature(feature: string, path?: string) {
  if (typeof window === "undefined") return;
  enqueue({
    type: "feature",
    feature,
    path: path || window.location.pathname,
  });
}

export function PixelTracker() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const startedAt = useRef(Date.now());
  const lastPath = useRef(pathname);

  useEffect(() => {
    function onFeature(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        trackFeature(detail.trim());
      }
    }
    window.addEventListener("aw:feature", onFeature as EventListener);
    return () =>
      window.removeEventListener("aw:feature", onFeature as EventListener);
  }, []);

  useEffect(() => {
    const path =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (shouldSkipPath(pathname)) return;

    // Close previous page time
    if (lastPath.current && lastPath.current !== pathname) {
      const spent = Date.now() - startedAt.current;
      if (spent > 800) {
        enqueue({
          type: "heartbeat",
          path: lastPath.current,
          durationMs: spent,
        });
      }
    }

    lastPath.current = pathname;
    startedAt.current = Date.now();
    enqueue({ type: "pageview", path: pathname });

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const spent = Date.now() - startedAt.current;
      startedAt.current = Date.now();
      if (spent > 1000) {
        enqueue({
          type: "heartbeat",
          path: pathname,
          durationMs: spent,
        });
      }
    }, 15000);

    function onHide() {
      const spent = Date.now() - startedAt.current;
      if (spent > 500) {
        enqueue({
          type: "heartbeat",
          path: pathname,
          durationMs: spent,
        });
        startedAt.current = Date.now();
      }
      void flush();
    }

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void path;
    };
  }, [pathname, searchParams]);

  return null;
}
