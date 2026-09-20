"use client";

import { usePathname } from "next/navigation";

export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return children;

  return (
    <div key={pathname} className="animate-page-fade">
      {children}
    </div>
  );
}
