import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import {
  adminPayload,
  ensureDatabase,
  findUser,
  publicCatalog,
  publicUser,
  readPublicDocs,
} from "@/lib/server/documents";
import { readSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" });
  }

  try {
    await ensureDatabase();
    const docs = await readPublicDocs();
    const userId = await readSessionUserId();
    const user = userId
      ? docs.users.find((entry) => entry.id === userId) ?? null
      : null;
    return NextResponse.json({
      ...publicCatalog(docs),
      admin: user ? adminPayload(docs, user) : null,
      sessionUser: user ? publicUser(user) : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database is unavailable";
    return NextResponse.json({ mode: "remote", error: message }, { status: 500 });
  }
}

export async function HEAD() {
  if (!isDatabaseEnabled()) return new NextResponse(null, { status: 204 });
  try {
    await findUser("missing");
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
