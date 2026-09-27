"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PageFadeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const isCheckout = pathname === "/checkout";

  return (
    <div
      key={key}
      className={isCheckout ? "animate-checkout-enter" : "animate-page-enter"}
    >
      {children}
    </div>
  );
}

export function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PageFadeInner>{children}</PageFadeInner>
    </Suspense>
  );
}
