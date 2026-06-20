"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { encryptToken } from "./crypto";
import { fetchAccountCreated } from "./github";
import { syncPlayer } from "./sync";

export type ActionResult = { ok: boolean; error?: string };

export async function addPlayer(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const githubLogin = String(formData.get("githubLogin") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!name || !githubLogin || !token) {
    return { ok: false, error: "Name, GitHub login, and token are all required." };
  }

  // Validate the token/login before saving anything.
  let accountCreated: string;
  try {
    accountCreated = await fetchAccountCreated(token, githubLogin);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not verify GitHub token." };
  }

  try {
    const player = await prisma.player.create({
      data: {
        name,
        githubLogin,
        tokenEncrypted: encryptToken(token),
        accountCreated: new Date(accountCreated),
      },
    });
    await syncPlayer(player.id, true); // initial pull
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { ok: false, error: `"${githubLogin}" is already registered.` };
    }
    return { ok: false, error: "Failed to add player." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayer(id: string): Promise<void> {
  await prisma.player.delete({ where: { id } });
  revalidatePath("/");
}

export async function saveContest(formData: FormData): Promise<ActionResult> {
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "End date must be on or after the start date." };
  }
  await prisma.contest.upsert({
    where: { id: 1 },
    create: { id: 1, startDate, endDate },
    update: { startDate, endDate },
  });
  revalidatePath("/");
  return { ok: true };
}
