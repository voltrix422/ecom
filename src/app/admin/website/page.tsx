"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaImage } from "@/components/media-image";
import { fileToHeroDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";
import { cn } from "cn";
import type { AnalyticsSummary } from "@/lib/server/analytics";

type Tab = "content" | "pixel";

function formatSeconds(total: number) {
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function shortDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function PixelPanel() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/analytics", {
          credentials: "include",
        });
        const json = (await response.json().catch(() => null)) as
          | AnalyticsSummary
          | { error?: string }
          | null;
        if (!response.ok) {
          if (!cancelled) {
            setError(
              json && "error" in json && json.error
                ? json.error
                : "Could not load pixel data"
            );
            setData(null);
          }
          return;
        }
        if (!cancelled) setData(json as AnalyticsSummary);
      } catch {
        if (!cancelled) setError("Could not load pixel data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Loading pixel…</p>;
  }

  if (error && !data) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) return null;

  const visitorCards = [
    { label: "Today", value: data.visitors.today },
    { label: "Yesterday", value: data.visitors.yesterday },
    { label: "Last 7 days", value: data.visitors.week },
    { label: "Last 30 days", value: data.visitors.month },
    { label: "All time", value: data.visitors.all },
  ];

  const viewCards = [
    { label: "Today", value: data.pageviews.today },
    { label: "Yesterday", value: data.pageviews.yesterday },
    { label: "Last 7 days", value: data.pageviews.week },
    { label: "Last 30 days", value: data.pageviews.month },
    { label: "All time", value: data.pageviews.all },
  ];

  const maxDaily = Math.max(
    1,
    ...data.daily.map((day) => Math.max(day.visitors, day.pageviews))
  );

  return (
    <div className="space-y-12">
      <section>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Shoppers
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Real people on phones and computers. Admin visits, bots, and broken
          URLs are removed. Same person on the same device counts once.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visitorCards.map((card) => (
            <div key={card.label}>
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
              <p className="font-nav-display mt-1 text-3xl tracking-tight tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Page views
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          How many store pages were opened. One person can open many pages.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {viewCards.map((card) => (
            <div key={card.label}>
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
              <p className="font-nav-display mt-1 text-3xl tracking-tight tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Last 30 days
        </p>
        {data.daily.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No visits yet. Open the store on another device to start collecting.
          </p>
        ) : (
          <div className="mt-5 flex h-40 items-end gap-1">
            {data.daily.map((day) => (
              <div
                key={day.day}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={`${shortDay(day.day)} · ${day.visitors} visitors · ${day.pageviews} views`}
              >
                <div
                  className="w-full bg-foreground/15"
                  style={{
                    height: `${Math.max(4, (day.pageviews / maxDaily) * 100)}%`,
                  }}
                />
                <div
                  className="w-full bg-foreground"
                  style={{
                    height: `${Math.max(2, (day.visitors / maxDaily) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 bg-foreground" /> Visitors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 bg-foreground/15" /> Views
          </span>
        </div>
      </section>

      <section>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Top pages · last 30 days
        </p>
        {data.pages.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No page data yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 py-2 text-[11px] text-muted-foreground">
              <span>Page</span>
              <span className="w-14 text-right">Views</span>
              <span className="w-16 text-right">People</span>
              <span className="w-16 text-right">Avg time</span>
            </div>
            {data.pages.map((page) => (
              <div
                key={page.path}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {page.label || page.path}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {page.path}
                  </span>
                </span>
                <span className="w-14 text-right tabular-nums">{page.views}</span>
                <span className="w-16 text-right tabular-nums">
                  {page.visitors}
                </span>
                <span className="w-16 text-right tabular-nums text-muted-foreground">
                  {formatSeconds(page.avgSeconds)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Actions · last 30 days
        </p>
        {data.features.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Bag, search, notify, and checkout actions show here.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {data.features.map((item) => (
              <div
                key={item.feature}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium">{item.label || item.feature}</span>
                <span className="tabular-nums text-muted-foreground">
                  {item.count} uses · {item.visitors} people
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
  const [tab, setTab] = useState<Tab>("content");

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
    <div className="max-w-4xl space-y-10">
      <div className="flex gap-1 border-b">
        {(
          [
            { id: "content", label: "Content" },
            { id: "pixel", label: "Pixel" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "font-nav-display px-4 py-2.5 text-sm tracking-wide transition-colors",
              tab === item.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "pixel" ? <PixelPanel /> : null}

      {tab === "content" ? (
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
              Use the original photo file, at least 2000px wide. Deleted images
              stay removed after refresh.
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
              Featured suits on the home page, with melt transitions every 5
              seconds.
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
      ) : null}
    </div>
  );
}
