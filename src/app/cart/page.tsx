"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const router = useRouter();
  const { setCartOpen } = useStore();

  useEffect(() => {
    setCartOpen(true);
    router.replace("/");
  }, [router, setCartOpen]);

  return null;
}
