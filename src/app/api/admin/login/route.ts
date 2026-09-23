import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { adminPayload, loginUser } from "@/lib/server/documents";
import { writeSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" }, { status: 409 });
  }
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const result = await loginUser(String(body.email || ""), String(body.password || ""));
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await writeSession(result.user.id);
    return NextResponse.json(adminPayload(result.docs, result.user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
