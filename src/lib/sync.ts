import { prisma } from "./prisma";
import { decryptToken } from "./crypto";
import { verifyToken, fetchDailyCommits, fetchTotalCommits } from "./github";
import { istToday } from "./time";

const STALE_MS = 5 * 60 * 1000; // on-page-load refresh only re-hits GitHub if older than this

/** Refresh one player: commit-only daily counts for the contest window + all-time total. */
export async function syncPlayer(playerId: string, force = false): Promise<void> {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  const previousSync = player.lastSyncedAt;
  if (!force) {
    // Atomically "claim" the refresh so concurrent page loads don't all hit GitHub.
    // Only the request that flips lastSyncedAt from stale → now proceeds.
    const claimed = await prisma.player.updateMany({
      where: {
        id: playerId,
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: new Date(Date.now() - STALE_MS) } }],
      },
      data: { lastSyncedAt: new Date() },
    });
    if (claimed.count === 0) return; // fresh enough, or another request is already syncing
  }

  try {
    const token = decryptToken(player.tokenEncrypted);
    const contest = await prisma.contest.findUnique({ where: { id: 1 } });

    let accountCreated = player.accountCreated?.toISOString();
    if (!accountCreated) {
      accountCreated = (await verifyToken(token, player.githubLogin)).createdAt;
    }

    const totalCommits = await fetchTotalCommits(token, player.githubLogin, accountCreated);

    // Daily window: contest start → min(end, today). Skipped if contest dates unset.
    if (contest?.startDate) {
      const today = istToday();
      const end = contest.endDate && contest.endDate < today ? contest.endDate : today;
      const daily = await fetchDailyCommits(token, player.githubLogin, contest.startDate, end);
      await prisma.$transaction([
        prisma.commitDaily.deleteMany({ where: { playerId } }),
        ...(daily.length
          ? [prisma.commitDaily.createMany({ data: daily.map((d) => ({ ...d, playerId })) })]
          : []),
      ]);
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { totalCommits, accountCreated: new Date(accountCreated), lastSyncedAt: new Date() },
    });
  } catch (e) {
    // Don't let a failed sync masquerade as a fresh one (keeps "last synced" honest).
    if (!force) {
      await prisma.player
        .updateMany({ where: { id: playerId }, data: { lastSyncedAt: previousSync } })
        .catch(() => {});
    }
    throw e;
  }
}

/** Refresh every player. Each uses its own token, so rate limits don't collide. */
export async function syncAllPlayers(force = false): Promise<void> {
  const players = await prisma.player.findMany({ select: { id: true, githubLogin: true } });
  const results = await Promise.allSettled(players.map((p) => syncPlayer(p.id, force)));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[sync] failed for @${players[i].githubLogin}:`, r.reason);
    }
  });
}
