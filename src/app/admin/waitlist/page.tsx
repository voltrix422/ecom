"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

type Entry = { email: string; createdAt: string };

export default function AdminWaitlistPage() {
  const { canAccess } = useStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notify", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as {
        entries?: Entry[];
        error?: string;
      } | null;
      if (!response.ok) {
        setError(data?.error || "Could not load waitlist");
        setEntries([]);
        return;
      }
      setEntries(data?.entries || []);
    } catch {
      setError("Could not load waitlist");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccess("website")) return;
    void load();
  }, [canAccess, load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => entry.email.includes(q));
  }, [entries, query]);

  if (!canAccess("website")) {
    return (
      <p className="text-sm text-muted-foreground">
        You don’t have access to this module.
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="group relative overflow-hidden bg-muted/35 px-5 py-5">
          <div className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-foreground/[0.03]" />
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Notify emails
            </p>
            <Mail className="size-4 text-muted-foreground/70" />
          </div>
          <p className="mt-4 font-heading text-3xl tracking-tight">
            {entries.length}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "email" : "emails"}
        </p>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-8 w-full max-w-[12rem] border-0 border-b border-foreground/15 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-[11px] tracking-wide text-muted-foreground uppercase">
              <th className="py-3 pr-4 font-medium">Email</th>
              <th className="py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-muted-foreground">
                  No notify emails yet.
                </td>
              </tr>
            ) : (
              visible.map((entry) => (
                <tr
                  key={`${entry.email}-${entry.createdAt}`}
                  className="border-b border-foreground/8"
                >
                  <td className="py-3 pr-4 break-all">{entry.email}</td>
                  <td className="py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
