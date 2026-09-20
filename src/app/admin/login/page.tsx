"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAdmin, ready } = useStore();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (ready && isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, ready, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = login(
      String(form.get("email") || ""),
      String(form.get("password") || "")
    );
    if (!ok) {
      setError("Invalid credentials");
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="relative min-h-svh">
      <Link
        href="/"
        aria-label="Open website"
        className="absolute top-2 left-2 flex items-end font-heading text-[clamp(8rem,28vw,18rem)] leading-[0.85] tracking-tight text-foreground opacity-20 transition-opacity hover:opacity-35 md:top-4 md:left-4"
      >
        {brand.name}
        <span
          className="mb-[0.18em] ml-[0.06em] inline-block size-[0.18em] shrink-0 rounded-full bg-current"
          aria-hidden
        />
      </Link>

      <div className="flex min-h-svh items-center justify-center px-6">
        <form onSubmit={onSubmit} className="w-full max-w-xs space-y-3">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue="admin@suitwear.store"
            required
            autoComplete="username"
            className="h-10 rounded-none border-0 border-b border-border/60 px-0 text-center shadow-none focus-visible:ring-0"
          />
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              defaultValue="admin"
              required
              autoComplete="current-password"
              className="h-10 rounded-none border-0 border-b border-border/60 px-0 pr-8 text-center shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              className="absolute top-1/2 right-0 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {error ? (
            <p className="text-center text-xs text-destructive">{error}</p>
          ) : null}
          <Button type="submit" className="mt-4 h-9 w-full rounded-none">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
