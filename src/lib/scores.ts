import { prisma } from "./prisma";
import { todayUTC } from "./sync";

export type PlayerStats = {
  id: string;
  name: string;
  githubLogin: string;
  totalCommits: number; // all-time cumulative
  competitionScore: number; // commits within contest window
  todayCommits: number;
  highestDay: number; // most commits in a single day during the contest
  lastSyncedAt: string | null;
};

export type ContestInfo = { startDate: string | null; endDate: string | null };

function inWindow(date: string, start: string | null, end: string | null): boolean {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

/** Everything the Stats tab + leaderboard need, ranked by competition score. */
export async function getLeaderboard(): Promise<{ contest: ContestInfo; players: PlayerStats[] }> {
  const [contest, players] = await Promise.all([
    prisma.contest.findUnique({ where: { id: 1 } }),
    prisma.player.findMany({ include: { daily: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const start = contest?.startDate ?? null;
  const end = contest?.endDate ?? null;
  const today = todayUTC();

  const stats: PlayerStats[] = players.map((p) => {
    const windowDays = p.daily.filter((d) => inWindow(d.date, start, end));
    return {
      id: p.id,
      name: p.name,
      githubLogin: p.githubLogin,
      totalCommits: p.totalCommits,
      competitionScore: windowDays.reduce((s, d) => s + d.count, 0),
      todayCommits: p.daily.find((d) => d.date === today)?.count ?? 0,
      highestDay: windowDays.reduce((m, d) => Math.max(m, d.count), 0),
      lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
    };
  });

  stats.sort((a, b) => b.competitionScore - a.competitionScore || b.totalCommits - a.totalCommits);
  return { contest: { startDate: start, endDate: end }, players: stats };
}

export type GraphData = {
  dates: string[]; // ordered day labels across the contest window
  series: { id: string; name: string; daily: number[]; cumulative: number[] }[];
};

/** Per-player daily + cumulative series for the two graphs. */
export async function getGraphData(): Promise<GraphData> {
  const [contest, players] = await Promise.all([
    prisma.contest.findUnique({ where: { id: 1 } }),
    prisma.player.findMany({ include: { daily: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const start = contest?.startDate ?? null;
  const end = contest?.endDate ?? todayUTC();
  if (!start) return { dates: [], series: [] };

  // Build a continuous date axis from start → end so every day shows (even zero-commit days).
  const dates: string[] = [];
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const series = players.map((p) => {
    const map = new Map(p.daily.map((d) => [d.date, d.count]));
    const daily = dates.map((day) => map.get(day) ?? 0);
    let running = 0;
    const cumulative = daily.map((c) => (running += c));
    return { id: p.id, name: p.name, daily, cumulative };
  });

  return { dates, series };
}
