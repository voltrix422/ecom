"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";

function CustomPointer() {
  useEffect(() => {
    const mac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!mac) {
      document.documentElement.dataset.cursor = "custom";
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <StoreProvider>
        <ScrollToTop />
        <CustomPointer />
        {children}
        <Toaster
          position="top-center"
          offset={18}
          gap={10}
          toastOptions={{
            classNames: {
              toast:
                "cn-toast !rounded-none !border-border !bg-background !text-foreground !shadow-none ring-1 ring-foreground/10",
              title: "font-heading !text-base !font-normal !tracking-tight",
              description: "!text-xs !tracking-wide !text-muted-foreground",
              actionButton:
                "!rounded-none !bg-foreground !text-background !text-xs !px-3 !h-7",
              closeButton: "!rounded-none",
            },
          }}
        />
      </StoreProvider>
    </ThemeProvider>
  );
}
