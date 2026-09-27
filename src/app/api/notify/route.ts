import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { readSessionUserId } from "@/lib/server/session";
import { addWaitlistEmail, readWaitlist } from "@/lib/server/waitlist";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await readSessionUserId();
  if (!userId && isDatabaseEnabled()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await readWaitlist();
  entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
    } | null;
    const email = body?.email?.trim().toLowerCase() || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }

    const result = await addWaitlistEmail(email);
    return NextResponse.json({ ok: true, already: result.already });
  } catch {
    return NextResponse.json(
      { error: "Could not save your email" },
      { status: 500 }
    );
  }
}
