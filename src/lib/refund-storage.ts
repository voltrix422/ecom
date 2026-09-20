import type { RefundStatus, RefundTicket } from "@/lib/types";

const LS_FULL = "form-suits-refunds-v1";
const LS_INDEX = "form-suits-refunds-index-v1";
const DB_NAME = "suitwear-store";
const DB_VERSION = 1;
const STORE = "kv";
const IDB_KEY = "refunds";
const CHANNEL = "suitwear-refunds";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function asTickets(value: unknown): RefundTicket[] {
  return Array.isArray(value) ? (value as RefundTicket[]) : [];
}

function statusRank(status: RefundStatus) {
  if (status === "Completed") return 2;
  if (status === "Approved" || status === "Rejected") return 1;
  return 0;
}

function mergeTicket(a: RefundTicket, b: RefundTicket): RefundTicket {
  return {
    ...a,
    ...b,
    photos: b.photos?.length ? b.photos : a.photos,
    voiceNote: b.voiceNote || a.voiceNote,
    payoutProof: b.payoutProof || a.payoutProof,
    payoutProofAt: b.payoutProofAt || a.payoutProofAt,
    payoutAccount: b.payoutAccount || a.payoutAccount,
    skipBankWait: Boolean(a.skipBankWait || b.skipBankWait),
    askBankDetails: Boolean(a.askBankDetails || b.askBankDetails),
    remark: b.remark || a.remark,
    note: b.note || a.note,
    status: statusRank(b.status) >= statusRank(a.status) ? b.status : a.status,
  };
}

export function mergeTickets(...lists: RefundTicket[][]) {
  const map = new Map<string, RefundTicket>();
  for (const list of lists) {
    for (const ticket of list) {
      const existing = map.get(ticket.id);
      map.set(ticket.id, existing ? mergeTicket(existing, ticket) : ticket);
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function slimTickets(tickets: RefundTicket[]): RefundTicket[] {
  return tickets.map((ticket) => ({
    ...ticket,
    photos: [],
    voiceNote: undefined,
    payoutProof: undefined,
  }));
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

async function idbPut(tickets: RefundTicket[]) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(tickets, IDB_KEY);
  });
  db.close();
}

async function idbGet() {
  try {
    const db = await openDb();
    const tickets = await new Promise<RefundTicket[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(IDB_KEY);
      request.onsuccess = () => resolve(asTickets(request.result));
      request.onerror = () => reject(request.error);
    });
    db.close();
    return tickets;
  } catch {
    return [] as RefundTicket[];
  }
}

function readLocalRefunds() {
  const full = asTickets(readJson(LS_FULL, []));
  if (full.length) return full;
  const index = asTickets(readJson(LS_INDEX, []));
  if (index.length) return index;
  try {
    const raw = window.sessionStorage.getItem(LS_FULL);
    return raw ? asTickets(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export async function loadRefunds() {
  const fromIdb = await idbGet();
  const fromLocal = readLocalRefunds();
  return mergeTickets(fromIdb, fromLocal);
}

export function persistRefunds(tickets: RefundTicket[]) {
  if (typeof window === "undefined") return;
  if (tickets.length === 0) return;

  writeJson(LS_INDEX, slimTickets(tickets));

  try {
    window.sessionStorage.setItem(LS_FULL, JSON.stringify(tickets));
  } catch {
    try {
      window.sessionStorage.setItem(LS_FULL, JSON.stringify(slimTickets(tickets)));
    } catch {
      /* ignore */
    }
  }

  const attempts = [
    tickets,
    tickets.map((ticket) => ({ ...ticket, voiceNote: undefined })),
    tickets.map((ticket) => ({
      ...ticket,
      voiceNote: undefined,
      photos: ticket.photos.slice(0, 2),
    })),
    slimTickets(tickets),
  ];
  for (const payload of attempts) {
    if (writeJson(LS_FULL, payload)) break;
  }

  void idbPut(tickets).catch(() => {
    void idbPut(slimTickets(tickets)).catch(() => undefined);
  });

  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(tickets);
    channel.close();
  } catch {
    /* ignore */
  }
}

export function subscribeRefunds(onTickets: (tickets: RefundTicket[]) => void) {
  if (typeof window === "undefined") return () => undefined;
  let channel: BroadcastChannel | null = null;
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LS_INDEX && event.key !== LS_FULL) return;
    if (!event.newValue) return;
    try {
      const tickets = asTickets(JSON.parse(event.newValue));
      if (tickets.length) onTickets(tickets);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      const tickets = asTickets(event.data);
      if (tickets.length) onTickets(tickets);
    };
  } catch {
    channel = null;
  }
  return () => {
    channel?.close();
    window.removeEventListener("storage", onStorage);
  };
}
