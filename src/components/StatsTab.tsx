import type { PlayerStats } from "@/lib/scores";
import type { CSSProperties } from "react";

export default function StatsTab({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return (
      <div className="card flex min-h-44 items-center justify-center p-8 text-center text-sm text-muted">
        No players registered yet — add some in Setup.
      </div>
    );
  }

  // Players arrive sorted by competition score; index 0 leads.
  const topScore = players[0]?.competitionScore ?? 0;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((p, i) => {
        const isLeader = i === 0 && topScore > 0;
        return (
          <div
            key={p.id}
            className="card p-5"
            style={isLeader ? ({ borderColor: "var(--gold)" } as CSSProperties) : undefined}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold text-ink">{p.name}</span>
                  {isLeader && (
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--gold)", color: "var(--gold)" }}
                    >
                      LEADER
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">@{p.githubLogin}</div>
              </div>
              <span
                className="shrink-0 rounded px-2.5 py-1 text-xs font-semibold"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: isLeader ? "var(--gold)" : "var(--muted)",
                }}
              >
                #{i + 1}
              </span>
            </div>

            <div className="mb-4">
              <div
                className="text-4xl font-bold tabular-nums"
                style={{ color: isLeader ? "var(--gold)" : "var(--blue)" }}
              >
                {p.competitionScore}
              </div>
              <div className="mt-0.5 text-xs text-muted">competition score</div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <Chip label="Total" value={p.totalCommits} color="var(--blue)" />
              <Chip label="Today" value={p.todayCommits} color="var(--green)" />
              <Chip
                label="Best day"
                value={p.highestDay}
                color="var(--purple)"
                sub={p.highestDay > 0 ? fmtDay(p.highestDayDate) : null}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string | null;
}) {
  return (
    <div
      className="rounded px-1 py-2.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="text-lg font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</div>
      {sub !== undefined && (
        <div className="mt-0.5 text-[10px] tabular-nums text-muted">{sub ?? "—"}</div>
      )}
    </div>
  );
}

/** "2026-06-18" → "Jun 18" (parsed as UTC so the day never shifts). */
function fmtDay(date: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
