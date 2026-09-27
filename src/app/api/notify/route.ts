import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/server/files";

export const dynamic = "force-dynamic";

type Entry = { email: string; createdAt: string };

function waitlistPath() {
  return path.join(uploadDir(), "waitlist.json");
}

async function readWaitlist(): Promise<Entry[]> {
  try {
    const raw = await readFile(
      /*turbopackIgnore: true*/ waitlistPath(),
      "utf8"
    );
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

    const list = await readWaitlist();
    if (list.some((entry) => entry.email === email)) {
      return NextResponse.json({ ok: true, already: true });
    }

    list.push({ email, createdAt: new Date().toISOString() });
    const dir = uploadDir();
    await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
    await writeFile(
      /*turbopackIgnore: true*/ waitlistPath(),
      JSON.stringify(list, null, 2),
      "utf8"
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not save your email" },
      { status: 500 }
    );
  }
}
