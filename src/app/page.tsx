import type { Metadata } from "next";
import ComingSoonPage from "@/components/coming-soon-page";
import { COMING_SOON } from "@/lib/site-mode";
import StoreHomePage from "@/app/main/page";

export const metadata: Metadata = COMING_SOON
  ? {
      title: "Coming soon — ayeshaswear",
      description: "ayeshaswear is launching soon. Leave your email to get notified.",
    }
  : {
      title: "ayeshaswear — Women’s unstitched suits",
      description: "Women’s unstitched three-piece shalwar kameez suits.",
    };

export default function HomePage() {
  if (COMING_SOON) return <ComingSoonPage />;
  return <StoreHomePage />;
}
