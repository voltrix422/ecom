import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import { PageFade } from "@/components/page-fade";
import { PageVeil } from "@/components/page-veil";

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
      <main className="flex-1 pb-24 md:pb-0">
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <WhatsAppFloat />
      <PageVeil />
    </div>
  );
}
