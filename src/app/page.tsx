import { syncAllPlayers } from "@/lib/sync";
import { getLeaderboard, getGraphData } from "@/lib/scores";
import Dashboard from "@/components/Dashboard";

// On-page-load refresh (staleness-guarded inside syncPlayer): opening the page
// re-pulls from GitHub only for players whose data is older than 5 minutes.
export const dynamic = "force-dynamic";

export default async function Home() {
  await syncAllPlayers();
  const [leaderboard, graph] = await Promise.all([getLeaderboard(), getGraphData()]);

  return (
    <Dashboard contest={leaderboard.contest} players={leaderboard.players} graph={graph} />
  );
}
