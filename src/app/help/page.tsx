import { StoreShell } from "@/components/storefront/store-shell";
import { RefundPanel } from "@/components/storefront/refund-panel";

export const metadata = {
  title: "Refund",
};

export default function HelpPage() {
  return (
    <StoreShell>
      <RefundPanel />
    </StoreShell>
  );
}
