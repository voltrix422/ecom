import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["audio/webm", "webm"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/ogg", "ogg"],
  ["video/webm", "webm"],
  ["video/mp4", "mp4"],
]);

export function uploadDir() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), "storage");
}

export function safeFileName(name: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  if (name.includes("..")) return null;
  return name;
}

export async function saveUpload(file: File) {
  const type = file.type.split(";")[0]?.trim().toLowerCase() || "";
  const ext = ALLOWED.get(type);
  if (!ext) {
    throw new Error("Upload a JPG, PNG, WEBP, GIF, or an audio note");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("File is larger than 12 MB");
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(
    path.join(/*turbopackIgnore: true*/ dir, name),
    bytes
  );
  return { url: `/media/${name}`, name, type };
}

export async function readUpload(name: string) {
  const safe = safeFileName(name);
  if (!safe) return null;
  try {
    const data = await readFile(
      /*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ uploadDir(), safe)
    );
    return { data, type: contentType(safe) };
  } catch {
    return null;
  }
}

function contentType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "webm") return "video/webm";
  if (ext === "mp4") return "video/mp4";
  return "image/jpeg";
}
