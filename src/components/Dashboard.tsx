"use client";

import { useState } from "react";
import type { ContestInfo, PlayerStats, GraphData } from "@/lib/scores";
import type { MoonPhase } from "@/lib/moon";
import Sidebar, { type NavItem } from "./Sidebar";
import OverviewTab from "./OverviewTab";
import SetupTab from "./SetupTab";
import StatsTab from "./StatsTab";
import GraphsTab from "./GraphsTab";
import { MoonDisc, IconToday, IconTrophy, IconChart, IconSettings, IconMenu } from "./Celestial";

type Tab = "overview" | "players" | "graphs" | "admin";

const NAV: NavItem[] = [
  { id: "overview", label: "Today", Icon: IconToday },
  { id: "players", label: "Players", Icon: IconTrophy },
  { id: "graphs", label: "Graphs", Icon: IconChart },
];
const ADMIN: NavItem = { id: "admin", label: "Admin", Icon: IconSettings };

export default function Dashboard({
  contest,
  players,
  graph,
  isAdmin,
  greeting,
  dateLabel,
  moon,
  daysLeft,
}: {
  contest: ContestInfo;
  players: PlayerStats[];
  graph: GraphData;
  isAdmin: boolean;
  greeting: string;
  dateLabel: string;
  moon: MoonPhase;
  daysLeft: number | null;
}) {
  const [tab, setTab] = useState<Tab>(contest.startDate || !isAdmin ? "overview" : "admin");
  const [navOpen, setNavOpen] = useState(false);

  const select = (id: string) => {
    setTab(id as Tab);
    setNavOpen(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={NAV}
        footerItem={ADMIN}
        active={tab}
        onSelect={select}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        contest={contest}
        daysLeft={daysLeft}
      />

      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-5 pb-14 sm:px-8">
          <header className="flex items-start justify-between gap-4 pt-7 pb-8">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
                aria-controls="app-sidebar"
                aria-expanded={navOpen}
                className="mt-1 rounded-md border p-1.5 text-ink-2 hover:text-ink lg:hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <IconMenu />
              </button>
              <div>
                <p className="text-sm text-muted">{dateLabel}</p>
                <h1 className="serif mt-3 text-[34px] font-semibold leading-tight text-ink sm:text-[40px]">
                  {greeting}, challengers
                </h1>
                <p className="mt-1.5 text-sm text-ink-2">Same sky, new progress. ✨</p>
              </div>
            </div>
            <div className="hidden shrink-0 flex-col items-center gap-1.5 text-center sm:flex">
              <MoonDisc phase={moon} size={64} />
              <div className="text-xs font-medium text-ink-2">{moon.name}</div>
              <div className="text-[11px] text-muted">{moon.illumination}% illuminated</div>
            </div>
          </header>

          <main>
            {tab === "overview" && <OverviewTab players={players} contest={contest} onNavigate={select} />}
            {tab === "players" && <StatsTab players={players} />}
            {tab === "graphs" && <GraphsTab graph={graph} players={players} />}
            {tab === "admin" && <SetupTab contest={contest} players={players} isAdmin={isAdmin} />}
          </main>
        </div>
      </div>
    </div>
  );
}
