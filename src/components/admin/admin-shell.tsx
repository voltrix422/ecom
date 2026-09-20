"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { peekAdminSession, useStore } from "@/lib/store";
import AdminLoginPage from "@/app/admin/login/page";
import type { AdminModule } from "@/lib/types";
import { cn } from "cn";

const links: {
  href: string;
  label: string;
  module: AdminModule;
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/admin", label: "Overview", module: "overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", module: "products", icon: Package },
  { href: "/admin/orders", label: "Orders", module: "orders", icon: ShoppingBag },
  { href: "/admin/refunds", label: "Refunds", module: "refunds", icon: RotateCcw },
  { href: "/admin/customers", label: "Customers", module: "customers", icon: Users },
  { href: "/admin/users", label: "Users", module: "users", icon: UserCog },
  { href: "/admin/website", label: "Website", module: "website", icon: Globe },
  { href: "/admin/settings", label: "Settings", module: "settings", icon: Settings },
];

function titleForPath(pathname: string) {
  if (pathname === "/admin/products/new") return "Add product";
  if (pathname.startsWith("/admin/products/") && pathname !== "/admin/products") {
    return "Edit product";
  }
  if (pathname.startsWith("/admin/products")) return "Products";
  if (pathname.startsWith("/admin/orders/") && pathname !== "/admin/orders") {
    return "Order";
  }
  if (pathname.startsWith("/admin/orders")) return "Orders";
  if (pathname.startsWith("/admin/refunds/") && pathname !== "/admin/refunds") {
    return "Refund ticket";
  }
  if (pathname.startsWith("/admin/refunds")) return "Refunds";
  if (pathname.startsWith("/admin/customers")) return "Customers";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/website")) return "Website";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Overview";
}

function moduleForPath(pathname: string): AdminModule {
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/refunds")) return "refunds";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/website")) return "website";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "overview";
}

function subscribeAdminSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, ready, logout, canAccess } = useStore();
  const hasSession = useSyncExternalStore(
    subscribeAdminSession,
    peekAdminSession,
    () => false
  );

  const [collapsed, setCollapsed] = useState(false);
  const visibleLinks = useMemo(
    () => links.filter((link) => canAccess(link.module)),
    [canAccess]
  );

  useEffect(() => {
    if (window.localStorage.getItem("form-admin-sidebar") === "1") {
      setCollapsed(true);
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("form-admin-sidebar", next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    if (!ready || !isAdmin) return;
    const module = moduleForPath(pathname);
    if (!canAccess(module)) {
      const fallback = visibleLinks[0]?.href ?? "/admin/login";
      if (fallback !== pathname) router.replace(fallback);
    }
  }, [ready, isAdmin, pathname, canAccess, visibleLinks, router]);

  if (!isAdmin) {
    if (hasSession && !ready) {
      return (
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Loading
        </div>
      );
    }
    return <AdminLoginPage />;
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading
      </div>
    );
  }

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 overflow-hidden border-r transition-[width] duration-500 ease-in-out md:flex md:flex-col",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
          className={cn(
            "flex h-16 items-center overflow-hidden transition-[padding] duration-500 ease-in-out",
            collapsed ? "justify-center px-2" : "px-5"
          )}
        >
          <BrandLogo
            size="sm"
            href={null}
            wordmarkClassName={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-in-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[9rem] opacity-100"
            )}
          />
        </button>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {visibleLinks.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                aria-label={link.label}
                className={cn(
                  "flex items-center gap-2 overflow-hidden py-2 text-sm text-muted-foreground transition-[padding] duration-500 ease-in-out hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                  collapsed ? "justify-center px-0" : "px-3"
                )}
              >
                <link.icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-500 ease-in-out",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[9rem] opacity-100"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-5 md:px-8">
          <h1 className="text-xl md:text-2xl">{titleForPath(pathname)}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-5 py-2 md:hidden">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-xs tracking-wide uppercase text-muted-foreground",
                (link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href)) && "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 px-5 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
