import { prisma } from "./prisma";
import { decryptToken } from "./crypto";
import { fetchAccountCreated, fetchDailyCommits, fetchTotalCommits } from "./github";

const STALE_MS = 5 * 60 * 1000; // on-page-load refresh only re-hits GitHub if older than this

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getContest() {
  return prisma.contest.findUnique({ where: { id: 1 } });
}

/** Refresh one player: commit-only daily counts for the contest window + all-time total. */
export async function syncPlayer(playerId: string, force = false): Promise<void> {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;
  if (!force && player.lastSyncedAt && Date.now() - player.lastSyncedAt.getTime() < STALE_MS) {
    return; // fresh enough — serve cached data
  }

  const token = decryptToken(player.tokenEncrypted);
  const contest = await getContest();

  let accountCreated = player.accountCreated?.toISOString();
  if (!accountCreated) {
    accountCreated = await fetchAccountCreated(token, player.githubLogin);
  }

  const totalCommits = await fetchTotalCommits(token, player.githubLogin, accountCreated);

  // Daily window: contest start → min(end, today). Skipped if contest dates unset.
  if (contest?.startDate) {
    const today = todayUTC();
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
}

/** Refresh every player. Each uses its own token, so rate limits don't collide. */
export async function syncAllPlayers(force = false): Promise<void> {
  const players = await prisma.player.findMany({ select: { id: true } });
  await Promise.allSettled(players.map((p) => syncPlayer(p.id, force)));
}
