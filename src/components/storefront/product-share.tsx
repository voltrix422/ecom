"use client";

import { useEffect, useState } from "react";
import { Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brand } from "@/lib/data";
import type { Product } from "@/lib/types";

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function shareMessage(name: string, href: string) {
  return `${name} — ${brand.name}\n${href}`;
}

export function ProductShare({ product }: { product: Product }) {
  const [href, setHref] = useState("");

  useEffect(() => {
    setHref(window.location.href);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(href || window.location.href);
    toast.success("Link copied");
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: `${product.name} — ${brand.name}`,
        text: `${product.name} — unstitched ${product.category.toLowerCase()} from ${brand.name}`,
        url: window.location.href,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  const encoded = encodeURIComponent(shareMessage(product.name, href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-none text-foreground/50 hover:text-foreground"
          aria-label="Share"
          onClick={(event) => {
            if (isMobile() && navigator.share) {
              event.preventDefault();
              void nativeShare();
            }
          }}
        >
          <Share2 className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-none">
        <DropdownMenuItem onSelect={copyLink} className="cursor-pointer">
          <Link2 />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`mailto:?subject=${encodeURIComponent(`${product.name} — ${brand.name}`)}&body=${encoded}`}
          >
            <Mail />
            Email
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a
            href={`https://wa.me/?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle />
            WhatsApp
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
