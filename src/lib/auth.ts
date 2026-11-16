import crypto from "crypto";
import { cookies } from "next/headers";

// Minimal admin auth: one shared ADMIN_PASSWORD, and a signed, expiring,
// httpOnly session cookie. Everyone can VIEW the leaderboard; only an admin can
// add/remove players or change contest dates. Server-side only.

const COOKIE = "ca_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** HMAC key bound to both secrets, so rotating either one invalidates all sessions. */
function signingKey(): Buffer | null {
  const pw = adminPassword();
  const enc = process.env.ENCRYPTION_KEY;
  if (!pw || !enc) return null;
  return crypto.createHmac("sha256", enc).update(pw).digest();
}

function sign(payload: string, key: Buffer): string {
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Constant-time password check. Always false if ADMIN_PASSWORD is not configured. */
export function checkPassword(candidate: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqual(candidate, pw);
}

export function adminConfigured(): boolean {
  return signingKey() !== null;
}

export async function startAdminSession(): Promise<void> {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD / ENCRYPTION_KEY are not configured.");
  const expires = String(Date.now() + SESSION_MS);
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const key = signingKey();
  if (!key) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, sig] = value.split(".");
  if (!expires || !sig) return false;
  if (!safeEqual(sig, sign(expires, key))) return false;
  return Number(expires) > Date.now();
}
