"use client";

import { useState } from "react";
import type { ContestInfo, PlayerStats, GraphData } from "@/lib/scores";
import SetupTab from "./SetupTab";
import StatsTab from "./StatsTab";
import GraphsTab from "./GraphsTab";

type Tab = "setup" | "stats" | "graphs";

const TABS: { id: Tab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "stats", label: "Stats" },
  { id: "graphs", label: "Graphs" },
];

export default function Dashboard({
  contest,
  players,
  graph,
}: {
  contest: ContestInfo;
  players: PlayerStats[];
  graph: GraphData;
}) {
  const [tab, setTab] = useState<Tab>(contest.startDate ? "stats" : "setup");

  // Summary figures (players already arrive sorted by competition score).
  const leader = players[0];
  const totalScore = players.reduce((s, p) => s + p.competitionScore, 0);
  const todayTotal = players.reduce((s, p) => s + p.todayCommits, 0);

  return (
    // Single, page-level scroll. One fixed-width frame shared by every tab so
    // switching tabs never changes the content's width or horizontal position.
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Commit Arena</h1>
          <p className="text-xs text-muted">
            {contest.startDate
              ? `Contest ${contest.startDate} → ${contest.endDate ?? "ongoing"}`
              : "No contest dates set — configure in Setup"}
          </p>
        </div>
        <nav className="flex gap-1 rounded-lg border border-border bg-panel p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent text-bg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Summary strip — always present, so the top of the page is stable and not blank. */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Players" value={players.length} />
        <SummaryTile label="Contest commits" value={totalScore} accent="accent" />
        <SummaryTile label="Today" value={todayTotal} accent="success" />
        <SummaryTile
          label="Leader"
          value={leader && leader.competitionScore > 0 ? leader.name : "—"}
          accent="gold"
          isText
        />
      </section>

      {/* Fixed min-height keeps the page tall enough that short tabs (Setup) don't
          collapse the layout or move the scrollbar relative to taller tabs. */}
      <main className="min-h-[60vh] pb-10">
        {tab === "setup" && <SetupTab contest={contest} players={players} />}
        {tab === "stats" && <StatsTab players={players} />}
        {tab === "graphs" && <GraphsTab graph={graph} players={players} />}
      </main>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent,
  isText,
}: {
  label: string;
  value: number | string;
  accent?: "accent" | "success" | "gold";
  isText?: boolean;
}) {
  const accentClass =
    accent === "accent"
      ? "text-accent"
      : accent === "success"
      ? "text-success"
      : accent === "gold"
      ? "text-gold"
      : "text-fg";
  return (
    <div className="panel px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 font-bold tabular-nums ${isText ? "truncate text-lg" : "text-2xl"} ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}
