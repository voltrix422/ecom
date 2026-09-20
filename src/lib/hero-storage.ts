import type { HeroBanner } from "@/lib/types";

const DB_NAME = "suitwear-store";
const DB_VERSION = 1;
const STORE = "kv";
const IDB_KEY = "heroBanners";
const IDS_KEY = "suitwear-hero-ids";
const CHANNEL = "suitwear-hero";

export const DEFAULT_HERO_BANNERS: HeroBanner[] = [
  { id: "hero-seed-rose", src: "/products/hero/rose-terrace.jpg" },
  { id: "hero-seed-yellow", src: "/products/hero/yellow-suit.jpg" },
];

function asBanners(value: unknown): HeroBanner[] {
  return Array.isArray(value) ? (value as HeroBanner[]) : [];
}

function readSavedIds() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IDS_KEY);
    if (raw === null) return null;
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? (ids as string[]) : null;
  } catch {
    return null;
  }
}

function writeSavedIds(banners: HeroBanner[]) {
  try {
    window.localStorage.setItem(
      IDS_KEY,
      JSON.stringify(banners.map((banner) => banner.id))
    );
  } catch {
    /* ignore */
  }
}

export function usableHeroBanners(banners: HeroBanner[]) {
  return banners.filter(
    (banner) => banner?.id && banner.src && !banner.src.startsWith("data:image/webp")
  );
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(banners: HeroBanner[]) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(banners, IDB_KEY);
  });
  db.close();
}

async function idbGet() {
  try {
    const db = await openDb();
    const result = await new Promise<{ exists: boolean; banners: HeroBanner[] }>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).get(IDB_KEY);
        request.onsuccess = () => {
          resolve(
            request.result === undefined
              ? { exists: false, banners: [] }
              : { exists: true, banners: asBanners(request.result) }
          );
        };
        request.onerror = () => reject(request.error);
      }
    );
    db.close();
    return result;
  } catch {
    return { exists: false, banners: [] as HeroBanner[] };
  }
}

export async function loadHeroBanners() {
  const stored = await idbGet();
  const savedIds = readSavedIds();

  if (savedIds) {
    if (savedIds.length === 0) return [] as HeroBanner[];
    const byId = new Map(
      stored.banners.map((banner) => [banner.id, banner] as const)
    );
    return usableHeroBanners(
      savedIds
        .map((id) => byId.get(id))
        .filter((banner): banner is HeroBanner => Boolean(banner))
    );
  }

  if (stored.exists) return usableHeroBanners(stored.banners);
  return DEFAULT_HERO_BANNERS;
}

export function persistHeroBanners(banners: HeroBanner[]) {
  if (typeof window === "undefined") return;
  writeSavedIds(banners);
  void idbPut(banners).catch(() => undefined);
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(banners);
    channel.close();
  } catch {
    /* ignore */
  }
}

export function subscribeHeroBanners(
  onBanners: (banners: HeroBanner[]) => void
) {
  if (typeof window === "undefined") return () => undefined;
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      onBanners(asBanners(event.data));
    };
  } catch {
    channel = null;
  }
  return () => channel?.close();
}
