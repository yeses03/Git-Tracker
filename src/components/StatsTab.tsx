import type { PlayerStats } from "@/lib/scores";

export default function StatsTab({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return <p className="text-sm text-zinc-500">No players registered yet — add some in Setup.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((p, i) => (
        <div
          key={p.id}
          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-zinc-500">@{p.githubLogin}</div>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              #{i + 1}
            </span>
          </div>

          <div className="mb-3">
            <div className="text-3xl font-bold tabular-nums">{p.competitionScore}</div>
            <div className="text-xs text-zinc-500">competition score</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Total" value={p.totalCommits} />
            <Stat label="Today" value={p.todayCommits} />
            <Stat label="Best day" value={p.highestDay} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/50">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}
