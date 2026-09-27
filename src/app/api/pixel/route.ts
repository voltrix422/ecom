import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { recordPixelEvents, type PixelEventInput } from "@/lib/server/analytics";

export const dynamic = "force-dynamic";

type IncomingEvent = {
  visitorId?: string;
  sessionId?: string;
  type?: string;
  path?: string;
  feature?: string;
  durationMs?: number;
  referrer?: string;
  isAdmin?: boolean;
};

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      events?: IncomingEvent[];
    } | null;
    const raw = Array.isArray(body?.events) ? body.events : [];
    const userAgent = request.headers.get("user-agent") || "";
    const events: PixelEventInput[] = raw
      .slice(0, 40)
      .map((event) => ({
        visitorId: String(event.visitorId || ""),
        sessionId: String(event.sessionId || ""),
        type: event.type as PixelEventInput["type"],
        path: String(event.path || "/"),
        feature: event.feature ? String(event.feature) : undefined,
        durationMs: Number(event.durationMs || 0),
        referrer: event.referrer ? String(event.referrer) : undefined,
        userAgent,
        isAdmin: Boolean(event.isAdmin),
      }))
      .filter(
        (event) =>
          event.visitorId &&
          event.sessionId &&
          ["pageview", "heartbeat", "feature"].includes(event.type)
      );

    if (events.length) await recordPixelEvents(events);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
