"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { metaPageView } from "@/lib/meta-pixel";

function shouldTrack(pathname: string) {
  return !pathname.startsWith("/admin");
}

/**
 * SPA PageView for client navigations.
 * Base pixel script lives in app/layout.tsx <head>.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldTrack(pathname)) {
      previousPath.current = pathname;
      return;
    }
    // First public load: PageView is fired by the base head script.
    if (previousPath.current === null) {
      previousPath.current = pathname;
      return;
    }
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    metaPageView();
  }, [pathname]);

  return null;
}
