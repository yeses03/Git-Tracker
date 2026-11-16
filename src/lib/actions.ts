"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { encryptToken } from "./crypto";
import { verifyToken } from "./github";
import { syncPlayer, syncAllPlayers } from "./sync";
import { isValidDay } from "./time";
import {
  adminConfigured,
  checkPassword,
  endAdminSession,
  isAdmin,
  startAdminSession,
} from "./auth";

export type ActionResult = { ok: boolean; error?: string };

const NOT_ADMIN: ActionResult = { ok: false, error: "Admin sign-in required." };

// GitHub usernames: alphanumerics and single hyphens, max 39 chars.
const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(formData: FormData): Promise<ActionResult> {
  if (!adminConfigured()) {
    return { ok: false, error: "Admin access is not configured on this server." };
  }
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { ok: false, error: "Incorrect password." };
  }
  await startAdminSession();
  revalidatePath("/");
  return { ok: true };
}

export async function logout(): Promise<void> {
  await endAdminSession();
  revalidatePath("/");
}

// ── Admin mutations (each one re-checks auth; never rely on the UI hiding them) ──

export async function addPlayer(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;

  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const githubLogin = String(formData.get("githubLogin") ?? "").trim().replace(/^@/, "");
  const token = String(formData.get("token") ?? "").trim();

  if (!name || !githubLogin || !token) {
    return { ok: false, error: "Name, GitHub login, and token are all required." };
  }
  if (!LOGIN_RE.test(githubLogin)) {
    return { ok: false, error: "That doesn't look like a valid GitHub username." };
  }

  // Validate the token/login before saving anything.
  let verified: { login: string; createdAt: string };
  try {
    verified = await verifyToken(token, githubLogin);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not verify GitHub token." };
  }

  let playerId: string;
  try {
    const player = await prisma.player.create({
      data: {
        name,
        githubLogin: verified.login, // canonical casing, so duplicates can't differ by case
        tokenEncrypted: encryptToken(token),
        accountCreated: new Date(verified.createdAt),
      },
    });
    playerId = player.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: `"${verified.login}" is already registered.` };
    }
    console.error("[addPlayer] create failed:", e);
    return { ok: false, error: "Failed to add player." };
  }

  // The player is saved; a slow/failed first pull must not look like a failed add.
  try {
    await syncPlayer(playerId, true);
  } catch (e) {
    console.error("[addPlayer] initial sync failed:", e);
    revalidatePath("/");
    return { ok: true, error: "Player added, but the first GitHub sync failed — it will retry on refresh." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    await prisma.player.delete({ where: { id } });
  } catch (e) {
    // P2025 = already gone; treat as success so the UI just refreshes.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) {
      console.error("[deletePlayer] failed:", e);
      return { ok: false, error: "Failed to remove player." };
    }
  }
  revalidatePath("/");
  return { ok: true };
}

export async function saveContest(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;

  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim() || null;

  if (!startDate || !isValidDay(startDate)) {
    return { ok: false, error: "A valid start date is required." };
  }
  if (endDate && !isValidDay(endDate)) {
    return { ok: false, error: "End date is not a valid date." };
  }
  if (endDate && endDate < startDate) {
    return { ok: false, error: "End date must be on or after the start date." };
  }
  await prisma.contest.upsert({
    where: { id: 1 },
    create: { id: 1, startDate, endDate },
    update: { startDate, endDate },
  });

  // The stored daily rows cover the OLD window; re-pull for the new one right away
  // (after the response, so saving stays fast).
  after(() => syncAllPlayers(true));

  revalidatePath("/");
  return { ok: true };
}
