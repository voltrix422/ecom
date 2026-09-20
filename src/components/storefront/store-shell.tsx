import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { PageFade } from "@/components/page-fade";

export function StoreShell({
  children,
  hideSaleBanner = false,
}: {
  children: React.ReactNode;
  hideSaleBanner?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <Header hideSaleBanner={hideSaleBanner} />
      <main className="flex-1">
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
