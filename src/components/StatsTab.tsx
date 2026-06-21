import type { PlayerStats } from "@/lib/scores";

export default function StatsTab({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return (
      <div className="panel flex min-h-40 items-center justify-center p-8 text-center text-sm text-muted">
        No players registered yet — add some in Setup.
      </div>
    );
  }

  // Players arrive sorted by competition score; index 0 leads.
  const topScore = players[0]?.competitionScore ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((p, i) => {
        const isLeader = i === 0 && topScore > 0;
        return (
          <div
            key={p.id}
            className={`panel relative overflow-hidden p-4 ${
              isLeader ? "ring-1 ring-accent" : ""
            }`}
          >
            {/* accent top bar */}
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${
                isLeader ? "bg-accent" : "bg-border"
              }`}
            />

            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-fg">{p.name}</span>
                  {isLeader && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">@{p.githubLogin}</div>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                #{i + 1}
              </span>
            </div>

            <div className="mb-3">
              <div className="font-mono text-3xl font-bold tabular-nums text-fg">
                {p.competitionScore}
              </div>
              <div className="text-xs text-muted">competition score</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Total" value={p.totalCommits} />
              <Stat label="Today" value={p.todayCommits} />
              <Stat label="Best day" value={p.highestDay} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-panel2/40 py-2">
      <div className="font-mono text-lg font-semibold tabular-nums text-fg">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
