import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Header } from "@/components/storefront/header";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { PageFade } from "@/components/page-fade";
import { PageVeil } from "@/components/page-veil";

export function StoreShell({
  children,
  hideSaleBanner = false,
  hideBottomNav = false,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideSaleBanner?: boolean;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      {hideHeader ? null : <Header hideSaleBanner={hideSaleBanner} />}
      <main className={hideBottomNav ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
        <PageFade>{children}</PageFade>
      </main>
      <CartDrawer />
      {hideBottomNav ? null : <MobileBottomNav />}
      <PageVeil />
    </div>
  );
}
