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

// ---- Chart theme — solid colors matching the app palette ----
const GRID_COLOR = "#30363d";
const TEXT_COLOR = "#8b949e";
// player1 = blue, player2 = orange; extra players fall back to the accent set.
const PALETTE = ["#2f81f7", "#d4a72c", "#2ea043", "#8957e5", "#da3633", "#3fb6c0", "#bc4fc2", "#57606a"];

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
      <div className="card flex min-h-44 items-center justify-center p-8 text-center text-sm text-muted">
        Set a contest start date in Setup to see the graphs.
      </div>
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
      borderRadius: 6,
    })),
  };
  const lineData = {
    labels,
    datasets: graph.series.map((s, i) => ({
      label: s.name,
      data: s.cumulative,
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length],
      tension: 0.3,
    })),
  };

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="tabbar mb-4">
          <button className={`tab${view === "daily" ? " active" : ""}`} onClick={() => setView("daily")}>
            Daily Commits
          </button>
          <button
            className={`tab${view === "cumulative" ? " active" : ""}`}
            onClick={() => setView("cumulative")}
          >
            Cumulative
          </button>
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
      <section className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Leaderboard</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2">#</th>
              <th>Player</th>
              <th className="text-right">Score</th>
              <th className="text-right">Total</th>
              <th className="text-right">Today</th>
              <th className="text-right">Best day</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td
                  className="py-2.5 font-semibold"
                  style={{ color: i === 0 ? "var(--gold)" : "var(--ink)" }}
                >
                  {i + 1}
                </td>
                <td className="text-ink">
                  {p.name} <span className="text-muted">@{p.githubLogin}</span>
                </td>
                <td
                  className="text-right font-semibold tabular-nums"
                  style={{ color: i === 0 ? "var(--gold)" : "var(--blue)" }}
                >
                  {p.competitionScore}
                </td>
                <td className="text-right tabular-nums text-muted">{p.totalCommits}</td>
                <td className="text-right tabular-nums text-muted">{p.todayCommits}</td>
                <td className="text-right tabular-nums text-muted">{p.highestDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
