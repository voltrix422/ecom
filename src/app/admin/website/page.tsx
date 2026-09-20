"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaImage } from "@/components/media-image";
import { fileToHeroDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";

export default function AdminWebsitePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { heroBanners, addHeroBanners, removeHeroBanner, canAccess, canEdit } =
    useStore();
  const [uploading, setUploading] = useState(false);

  if (!canAccess("website")) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to view website.
      </p>
    );
  }

  const editable = canEdit();

  async function onFiles(files: FileList | null) {
    if (!files?.length || !editable) return;
    setUploading(true);
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
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Hero images
        </p>
        {editable ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => onFiles(event.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {uploading ? "Uploading" : "Upload"}
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
    </div>
  );
}
