import type { PlayerStats, ContestInfo } from "@/lib/scores";
import { IconSun, IconCheck, IconUser } from "./Celestial";

const SHOWN = 5;

/** Derives the briefing purely from the loaded data — never invents numbers. */
function briefing(players: PlayerStats[], contest: ContestInfo): string {
  if (!contest.startDate) return "No contest is running yet. Once an admin sets the dates, standings will appear here.";
  if (players.length === 0) return "The contest is set, but no players have joined yet.";
  const active = players.filter((p) => p.todayCommits > 0);
  const todayTotal = players.reduce((s, p) => s + p.todayCommits, 0);
  const leader = players[0];
  const parts: string[] = [];
  parts.push(
    active.length === 0
      ? "No commits have landed today yet."
      : `${active.length} of ${players.length} player${players.length === 1 ? " has" : "s have"} committed today, ${todayTotal} commit${todayTotal === 1 ? "" : "s"} in all.`,
  );
  if (leader.competitionScore > 0) {
    const second = players[1];
    parts.push(
      second && second.competitionScore === leader.competitionScore
        ? `${leader.name} and ${second.name} are tied at ${leader.competitionScore}.`
        : `${leader.name} leads with ${leader.competitionScore} contest commit${leader.competitionScore === 1 ? "" : "s"}.`,
    );
  }
  return parts.join(" ");
}

export default function OverviewTab({
  players,
  contest,
  onNavigate,
}: {
  players: PlayerStats[];
  contest: ContestInfo;
  onNavigate: (id: string) => void;
}) {
  const todayRows = [...players].sort((a, b) => b.todayCommits - a.todayCommits || b.competitionScore - a.competitionScore);
  const topScore = players[0]?.competitionScore ?? 0;

  return (
    <div className="space-y-9">
      <section className="panel flex gap-3.5 p-5" aria-labelledby="briefing-h">
        <IconSun className="mt-0.5 shrink-0 text-gold" />
        <div>
          <h2 id="briefing-h" className="text-sm font-semibold text-ink">Today&apos;s briefing</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{briefing(players, contest)}</p>
        </div>
      </section>

      <section aria-labelledby="today-h">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="today-h" className="section-title">Today</h2>
        </div>
        {players.length === 0 ? (
          <Empty text="No players yet." />
        ) : (
          <>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {todayRows.slice(0, SHOWN).map((p) => {
                const rank = players.indexOf(p) + 1;
                const done = p.todayCommits > 0;
                return (
                  <li key={p.id} className="flex items-center gap-3.5 py-3 text-sm" style={{ borderColor: "var(--border)" }}>
                    <span className={`check${done ? " done" : ""}`} role="img" aria-label={done ? "Committed today" : "No commits yet today"}>
                      <IconCheck />
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${done ? "text-ink" : "text-ink-2"}`}>
                      {p.name} <span className="text-muted">@{p.githubLogin}</span>
                    </span>
                    <span className="w-20 text-right tabular-nums text-ink-2">
                      {p.todayCommits} commit{p.todayCommits === 1 ? "" : "s"}
                    </span>
                    <span className={`badge w-14 text-center ${rank === 1 && topScore > 0 ? "badge-medium" : "badge-low"}`}>#{rank}</span>
                  </li>
                );
              })}
            </ul>
            {players.length > SHOWN && (
              <button onClick={() => onNavigate("players")} className="mt-2 text-sm text-ink-2 hover:text-ink">
                View all ({players.length})
              </button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="players-h">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="players-h" className="section-title">Standings</h2>
          <button onClick={() => onNavigate("players")} className="text-sm text-ink-2 hover:text-ink">View all →</button>
        </div>
        {players.length === 0 ? (
          <Empty text="Standings appear once players are registered." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {players.slice(0, 4).map((p) => {
              const pct = topScore > 0 ? Math.round((p.competitionScore / topScore) * 100) : 0;
              return (
                <div key={p.id} className="card interactive flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <IconUser />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                    <div className="mt-0.5 text-xs tabular-nums text-muted">{p.competitionScore} commits</div>
                    <div className="progress mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} relative to leader`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card p-8 text-center text-sm text-muted">{text}</div>;
}
