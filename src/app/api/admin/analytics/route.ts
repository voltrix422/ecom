import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { findUser } from "@/lib/server/documents";
import { getAnalyticsSummary } from "@/lib/server/analytics";
import { canAccessModule } from "@/lib/admin";
import { readSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const userId = await readSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await findUser(userId);
  if (!user || !canAccessModule(user, "website")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
