import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import {
  adminPayload,
  findUser,
  mutateAs,
} from "@/lib/server/documents";
import { readSessionUserId } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" }, { status: 409 });
  }
  const userId = await readSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  }
  const user = await findUser(userId);
  if (!user) {
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const result = await mutateAs(user, body);
    return NextResponse.json(adminPayload(result.docs, result.user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
