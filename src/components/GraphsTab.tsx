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

// ---- Colors (GitHub-dark theme) ----
const PLAYER_COLORS = ["#58a6ff", "#f78166", "#3fb950", "#d29922", "#bc8cff", "#f85149", "#39c5cf", "#db61a2"];
const GRID_COLOR = "#30363d"; // grid lines
const TEXT_COLOR = "#848d97"; // axis/legend text

type View = "daily" | "cumulative";

const commonOptions: ChartOptions<"bar" | "line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: TEXT_COLOR } } },
  scales: {
    x: { ticks: { color: TEXT_COLOR }, grid: { color: GRID_COLOR } },
    y: { ticks: { color: TEXT_COLOR }, grid: { color: GRID_COLOR }, beginAtZero: true },
  },
};

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

  const barData = {
    labels,
    datasets: graph.series.map((s, i) => ({
      label: s.name,
      data: s.daily,
      backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
    })),
  };

  const lineData = {
    labels,
    datasets: graph.series.map((s, i) => ({
      label: s.name,
      data: s.cumulative,
      borderColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
      backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
      tension: 0.25,
    })),
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        {/* Toggle */}
        <div className="mb-3 flex gap-2">
          <Toggle active={view === "daily"} onClick={() => setView("daily")}>
            Daily Commits
          </Toggle>
          <Toggle active={view === "cumulative"} onClick={() => setView("cumulative")}>
            Cumulative
          </Toggle>
        </div>

        <div className="h-[420px]">
          {view === "daily" ? (
            <Bar data={barData} options={commonOptions as ChartOptions<"bar">} />
          ) : (
            <Line data={lineData} options={commonOptions as ChartOptions<"line">} />
          )}
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

function Toggle({
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
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
