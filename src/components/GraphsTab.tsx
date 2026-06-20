"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { GraphData, PlayerStats } from "@/lib/scores";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

// ---- Chart theme (GitHub-dark, per spec) ----
const P1_COLOR = "#58a6ff";
const P2_COLOR = "#f78166";
const GRID_COLOR = "#30363d";
const TEXT_COLOR = "#848d97";
// player1 = blue, player2 = orange; extra players fall back to GitHub accents.
const PALETTE = [P1_COLOR, P2_COLOR, "#3fb950", "#d29922", "#bc8cff", "#f85149", "#39c5cf", "#db61a2"];

// Shared options object — identical for both charts (spec §7).
const common: ChartOptions<"bar" | "line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: TEXT_COLOR } } },
  scales: {
    x: { ticks: { color: TEXT_COLOR }, grid: { color: GRID_COLOR } },
    y: { ticks: { color: TEXT_COLOR }, grid: { color: GRID_COLOR }, beginAtZero: true },
  },
};

type View = "daily" | "cumulative";

export default function GraphsTab({
  graph,
  players,
}: {
  graph: GraphData;
  players: PlayerStats[];
}) {
  const [view, setView] = useState<View>("daily");

  if (graph.dates.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Set a contest start date in Setup to see the graphs.</p>
    );
  }

  const labels = graph.dates.map((d) => d.slice(5)); // MM-DD

  // Datasets always ordered [player1, player2, …] (spec §3).
  const barData = {
    labels,
    datasets: graph.series.map((s, i) => ({
      label: s.name,
      data: s.daily,
      backgroundColor: PALETTE[i % PALETTE.length],
    })),
  };
  const lineData = {
    labels,
    datasets: graph.series.map((s, i) => ({
      label: s.name,
      data: s.cumulative,
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length],
      tension: 0.25,
    })),
  };

  return (
    <div className="space-y-5">
      {/* .charts container (spec §6) */}
      <section style={{ background: "#161b22", borderRadius: 12, padding: "10px 14px" }}>
        <div className="mb-2 flex gap-1.5">
          <Tab active={view === "daily"} onClick={() => setView("daily")}>
            Daily Commits
          </Tab>
          <Tab active={view === "cumulative"} onClick={() => setView("cumulative")}>
            Cumulative
          </Tab>
        </div>

        {/* Both charts always mounted; tabs toggle CSS visibility only (spec §8). */}
        <div style={{ height: 300 }} className={view === "daily" ? "" : "hidden"}>
          <Bar data={barData} options={common as ChartOptions<"bar">} />
        </div>
        <div style={{ height: 300 }} className={view === "cumulative" ? "" : "hidden"}>
          <Line data={lineData} options={common as ChartOptions<"line">} />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Leaderboard
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-1.5">#</th>
              <th>Player</th>
              <th className="text-right">Score</th>
              <th className="text-right">Total</th>
              <th className="text-right">Today</th>
              <th className="text-right">Best day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {players.map((p, i) => (
              <tr key={p.id}>
                <td className="py-2 font-medium">{i + 1}</td>
                <td>
                  {p.name} <span className="text-zinc-500">@{p.githubLogin}</span>
                </td>
                <td className="text-right font-semibold tabular-nums">{p.competitionScore}</td>
                <td className="text-right tabular-nums text-zinc-500">{p.totalCommits}</td>
                <td className="text-right tabular-nums text-zinc-500">{p.todayCommits}</td>
                <td className="text-right tabular-nums text-zinc-500">{p.highestDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// Tab button (spec §6 .tab / .tab.active).
function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? P1_COLOR : "#0d1117",
        color: active ? "#fff" : "#e6edf3",
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}
