import { after } from "next/server";
import { syncAllPlayers } from "@/lib/sync";
import { getLeaderboard, getGraphData } from "@/lib/scores";
import { isAdmin } from "@/lib/auth";
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

  return (
    <Dashboard
      contest={leaderboard.contest}
      players={leaderboard.players}
      graph={graph}
      isAdmin={admin}
    />
  );
}
