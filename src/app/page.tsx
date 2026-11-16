import { after } from "next/server";
import { syncAllPlayers } from "@/lib/sync";
import { getLeaderboard, getGraphData } from "@/lib/scores";
import { isAdmin } from "@/lib/auth";
import { moonPhase } from "@/lib/moon";
import { istDateLabel, istGreeting, istToday, daysBetween } from "@/lib/time";
import Dashboard from "@/components/Dashboard";

// Per-request render (admin cookie + live scores).
export const dynamic = "force-dynamic";
// Room for the post-response GitHub refresh below (Vercel Hobby caps this at 60s).
export const maxDuration = 60;

export default async function Home() {
  // Serve what's in the database immediately, then refresh stale players AFTER the
  // response is sent (staleness-guarded inside syncPlayer, so it only hits GitHub
  // for data older than 5 minutes). Visitors never wait on GitHub.
  after(() => syncAllPlayers());

  const [leaderboard, graph, admin] = await Promise.all([
    getLeaderboard(),
    getGraphData(),
    isAdmin(),
  ]);

  const { startDate, endDate } = leaderboard.contest;
  const today = istToday();
  // Days remaining after today: -1 = ended, 0 = last day, null = no end date.
  const daysLeft = startDate && endDate ? (endDate < today ? -1 : daysBetween(today, endDate).length - 1) : null;

  return (
    <Dashboard
      contest={leaderboard.contest}
      players={leaderboard.players}
      graph={graph}
      isAdmin={admin}
      greeting={istGreeting()}
      dateLabel={istDateLabel()}
      moon={moonPhase()}
      daysLeft={daysLeft}
    />
  );
}
