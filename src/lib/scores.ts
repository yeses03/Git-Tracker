import { prisma } from "./prisma";
import { istToday } from "./time";

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

/** Shift a YYYY-MM-DD date by `delta` days (UTC). */
function shiftDay(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Inclusive, gap-free list of YYYY-MM-DD days from start to end. */
function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Everything the Stats tab + leaderboard need, ranked by competition score. */
export async function getLeaderboard(): Promise<{ contest: ContestInfo; players: PlayerStats[] }> {
  const [contest, players] = await Promise.all([
    prisma.contest.findUnique({ where: { id: 1 } }),
    prisma.player.findMany({ include: { daily: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const start = contest?.startDate ?? null;
  const end = contest?.endDate ?? null;
  const today = istToday();

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
  if (!start) return { dates: [], series: [] };

  // Graphs show a fixed 5-day window: today−2 … today+2.
  const today = istToday();
  const displayStart = shiftDay(today, -2);
  const displayEnd = shiftDay(today, 2);
  const dates = daysBetween(displayStart, displayEnd);

  // Accumulate cumulative totals from the contest start (so the cumulative line
  // carries the real running total), but only emit the displayed window slice.
  const accStart = start < displayStart ? start : displayStart;
  const accDates = daysBetween(accStart, displayEnd);

  const series = players.map((p) => {
    const map = new Map(p.daily.map((d) => [d.date, d.count]));
    let running = 0;
    const daily: number[] = [];
    const cumulative: number[] = [];
    for (const day of accDates) {
      const c = map.get(day) ?? 0;
      running += c;
      if (day >= displayStart) {
        daily.push(c);
        cumulative.push(running);
      }
    }
    return { id: p.id, name: p.name, daily, cumulative };
  });

  return { dates, series };
}
