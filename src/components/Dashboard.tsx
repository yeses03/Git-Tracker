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

  return (
    <div className="mx-auto flex h-screen max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Commit Arena</h1>
          <p className="text-xs text-zinc-500">
            {contest.startDate
              ? `Contest ${contest.startDate} → ${contest.endDate ?? "ongoing"}`
              : "No contest dates set — configure in Setup"}
          </p>
        </div>
        <nav className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-6" style={{ scrollbarGutter: "stable" }}>

        {tab === "setup" && <SetupTab contest={contest} players={players} />}
        {tab === "stats" && <StatsTab players={players} />}
        {tab === "graphs" && <GraphsTab graph={graph} players={players} />}
      </main>
    </div>
  );
}
