import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { uploadDir } from "@/lib/server/files";

export type WaitlistEntry = { email: string; createdAt: string };

export function waitlistPath() {
  return path.join(uploadDir(), "waitlist.json");
}

export async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const raw = await readFile(
      /*turbopackIgnore: true*/ waitlistPath(),
      "utf8"
    );
    const parsed = JSON.parse(raw) as WaitlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addWaitlistEmail(email: string) {
  const list = await readWaitlist();
  if (list.some((entry) => entry.email === email)) {
    return { already: true as const, list };
  }
  list.push({ email, createdAt: new Date().toISOString() });
  const dir = uploadDir();
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  await writeFile(
    /*turbopackIgnore: true*/ waitlistPath(),
    JSON.stringify(list, null, 2),
    "utf8"
  );
  return { already: false as const, list };
}
