import { MediaImage } from "@/components/media-image";
import { StoreShell } from "@/components/storefront/store-shell";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          The house
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl leading-tight md:text-6xl">
          Women’s unstitched suits. Fabric first. Stitch later.
        </h1>
        <div className="mt-14 grid gap-12 md:grid-cols-2">
          <MediaImage
            src="/products/suit-ivory-garden.png"
            alt="Floral ivory and blue shalwar kameez"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="max-w-md space-y-5 text-sm leading-7 text-muted-foreground md:pt-8">
            <p>
              suitwear sells unstitched three-piece suits for women — lawn,
              chiffon, khaddar, silk, and cotton. Shirt, trouser, and dupatta
              arrive as fabric. You decide the cut.
            </p>
            <p>
              The shop stays quiet. Grey, clean, no extra noise — so the cloth
              is what you look at.
            </p>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
