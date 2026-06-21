"use client";

import { useState, type CSSProperties } from "react";
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
    // One page-level scroll + one fixed-width frame shared by every tab, so
    // switching tabs never changes the content's width or position.
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Commit Arena</h1>
          <p className="mt-0.5 text-sm text-muted">
            {contest.startDate
              ? `Contest ${contest.startDate} → ${contest.endDate ?? "ongoing"}`
              : "No contest dates set — configure in Setup"}
          </p>
        </div>
        <nav className="tabbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab${tab === t.id ? " active" : ""}`}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Color-coded, boxed summary tiles — always present so the top is stable. */}
      <section className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tile label="Players" value={players.length} color="var(--blue)" />
        <Tile label="Contest commits" value={totalScore} color="var(--purple)" />
        <Tile label="Commits today" value={todayTotal} color="var(--green)" />
        <Tile
          label="Leader"
          value={leader && leader.competitionScore > 0 ? leader.name : "—"}
          color="var(--gold)"
          isText
        />
      </section>

      {/* Fixed min-height so short tabs (Setup) don't collapse the page. */}
      <main className="min-h-[60vh] pb-12">
        {tab === "setup" && <SetupTab contest={contest} players={players} />}
        {tab === "stats" && <StatsTab players={players} />}
        {tab === "graphs" && <GraphsTab graph={graph} players={players} />}
      </main>
    </div>
  );
}

function Tile({
  label,
  value,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="tile" style={{ "--tile-accent": color } as CSSProperties}>
      <div className="tile-k">{label}</div>
      <div className={`tile-v${isText ? " text truncate" : " tabular-nums"}`}>{value}</div>
    </div>
  );
}
