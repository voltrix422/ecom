import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ecom_session";
const WEEK = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET?.trim() || "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: WEEK,
  };
}

export async function readSessionUserId() {
  if (!secret()) return null;
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id?: string;
      exp?: number;
    };
    if (!data.id || !data.exp || data.exp < Date.now()) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function writeSession(userId: string) {
  if (!secret()) {
    throw new Error("Set AUTH_SECRET in the server environment before signing in");
  }
  const payload = Buffer.from(
    JSON.stringify({ id: userId, exp: Date.now() + WEEK * 1000 })
  ).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, sessionCookieOptions());
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
