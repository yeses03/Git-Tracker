"use client";

import type { ComponentType } from "react";
import type { ContestInfo } from "@/lib/scores";
import { CrescentLogo, SidebarLandscape, IconClose } from "./Celestial";

export type NavItem = { id: string; label: string; Icon: ComponentType<{ className?: string }> };

export default function Sidebar({
  items,
  footerItem,
  active,
  onSelect,
  open,
  onClose,
  contest,
  daysLeft,
}: {
  items: NavItem[];
  footerItem: NavItem;
  active: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
  contest: ContestInfo;
  daysLeft: number | null;
}) {
  const render = (it: NavItem) => (
    <li key={it.id}>
      <button
        onClick={() => onSelect(it.id)}
        className={`nav-item${active === it.id ? " active" : ""}`}
        aria-current={active === it.id ? "page" : undefined}
      >
        <it.Icon />
        {it.label}
      </button>
    </li>
  );

  return (
    <>
      {/* Mobile scrim (opaque-ish solid, no blur) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-w)] flex-col overflow-hidden border-r transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <CrescentLogo />
            <span className="serif text-[26px] font-semibold leading-none text-ink">Commit Arena</span>
          </div>
          <button onClick={onClose} aria-label="Close navigation" className="text-muted hover:text-ink lg:hidden">
            <IconClose />
          </button>
        </div>

        <nav className="px-3">
          <ul className="space-y-1">{items.map(render)}</ul>
        </nav>

        <div className="mt-7 px-5">
          <div className="eyebrow">Contest</div>
          <div className="mt-2 text-[13px] leading-relaxed text-ink-2">
            {contest.startDate ? (
              <>
                <div className="tabular-nums">
                  {contest.startDate} → {contest.endDate ?? "ongoing"}
                </div>
                {daysLeft !== null && (
                  <div className="text-muted">
                    {daysLeft < 0 ? "Contest ended" : daysLeft === 0 ? "Last day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted">Not started</span>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <p className="serif px-5 pb-3 text-[15px] italic leading-snug text-muted">
            A little progress every day leads to big things.
          </p>
          <SidebarLandscape />
          <div className="border-t px-3 py-3" style={{ borderColor: "var(--border)", background: "var(--sidebar)" }}>
            <ul>{render(footerItem)}</ul>
          </div>
        </div>
      </aside>
    </>
  );
}
