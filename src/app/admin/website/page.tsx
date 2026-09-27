"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaImage } from "@/components/media-image";
import { fileToHeroDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";

export default function AdminWebsitePage() {
  const heroFileRef = useRef<HTMLInputElement>(null);
  const collectionFileRef = useRef<HTMLInputElement>(null);
  const {
    heroBanners,
    addHeroBanners,
    removeHeroBanner,
    collectionSlides,
    addCollectionSlides,
    updateCollectionSlide,
    removeCollectionSlide,
    canAccess,
    canEdit,
  } = useStore();
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingCollection, setUploadingCollection] = useState(false);

  if (!canAccess("website")) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to view website.
      </p>
    );
  }

  const editable = canEdit();

  async function onHeroFiles(files: FileList | null) {
    if (!files?.length || !editable) return;
    setUploadingHero(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        next.push(await fileToHeroDataUrl(file));
      }
      if (!next.length) {
        toast.error("Choose image files");
        return;
      }
      addHeroBanners(next);
      toast.success(
        `${next.length} ${next.length === 1 ? "image" : "images"} added`
      );
    } catch {
      toast.error("Could not upload");
    } finally {
      setUploadingHero(false);
      if (heroFileRef.current) heroFileRef.current.value = "";
    }
  }

  async function onCollectionFiles(files: FileList | null) {
    if (!files?.length || !editable) return;
    setUploadingCollection(true);
    try {
      const next: { src: string; caption?: string }[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const src = await fileToHeroDataUrl(file);
        const caption = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim();
        next.push({ src, caption: caption || undefined });
      }
      if (!next.length) {
        toast.error("Choose image files");
        return;
      }
      addCollectionSlides(next);
      toast.success(
        `${next.length} collection ${next.length === 1 ? "slide" : "slides"} added`
      );
    } catch {
      toast.error("Could not upload");
    } finally {
      setUploadingCollection(false);
      if (collectionFileRef.current) collectionFileRef.current.value = "";
    }
  }

  return (
    <div className="max-w-3xl space-y-14">
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Hero images
          </p>
          {editable ? (
            <>
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => onHeroFiles(event.target.files)}
              />
              <button
                type="button"
                disabled={uploadingHero}
                onClick={() => heroFileRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {uploadingHero ? "Uploading" : "Upload"}
              </button>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {heroBanners.length}{" "}
          {heroBanners.length === 1 ? "image" : "images"}. They fade every 8
          seconds on the home page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the original photo file, at least 2000px wide. Deleted images stay
          removed after refresh.
        </p>

        {heroBanners.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No hero images yet. Upload as many as you need.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {heroBanners.map((banner, index) => (
              <div key={banner.id} className="relative bg-muted/40">
                <MediaImage
                  src={banner.src}
                  alt={`Hero ${index + 1}`}
                  sizes="(min-width: 640px) 20vw, 45vw"
                />
                {editable ? (
                  <button
                    type="button"
                    onClick={() => removeHeroBanner(banner.id)}
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 bg-background/80 p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Collection slider
          </p>
          {editable ? (
            <>
              <input
                ref={collectionFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => onCollectionFiles(event.target.files)}
              />
              <button
                type="button"
                disabled={uploadingCollection}
                onClick={() => collectionFileRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {uploadingCollection ? "Uploading" : "Upload"}
              </button>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {collectionSlides.length}{" "}
          {collectionSlides.length === 1 ? "slide" : "slides"}. Shown under
          Featured suits on the home page, with melt transitions every 5 seconds.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a caption (e.g. Lawn) and optional shop link for each slide.
        </p>

        {collectionSlides.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No collection slides yet. Upload images to show Lawn, Chiffon,
            Khaddar, or any look you want.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {collectionSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="grid gap-3 border border-black/10 p-3 sm:grid-cols-[140px_1fr_auto]"
              >
                <div className="relative bg-muted/40">
                  <MediaImage
                    src={slide.src}
                    alt={slide.caption || `Slide ${index + 1}`}
                    sizes="140px"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[11px] text-muted-foreground">
                      Caption
                    </span>
                    <input
                      type="text"
                      defaultValue={slide.caption || ""}
                      disabled={!editable}
                      placeholder="Lawn"
                      className="mt-1 w-full border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-60"
                      onBlur={(event) =>
                        updateCollectionSlide(slide.id, {
                          caption: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-muted-foreground">
                      Link
                    </span>
                    <input
                      type="text"
                      defaultValue={slide.href || ""}
                      disabled={!editable}
                      placeholder="/shop?category=Lawn"
                      className="mt-1 w-full border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-60"
                      onBlur={(event) =>
                        updateCollectionSlide(slide.id, {
                          href: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => removeCollectionSlide(slide.id)}
                    aria-label="Remove slide"
                    className="self-start justify-self-end p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
