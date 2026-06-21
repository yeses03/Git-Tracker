"use client";

import { useState, useTransition } from "react";
import type { ContestInfo, PlayerStats } from "@/lib/scores";
import { addPlayer, deletePlayer, saveContest } from "@/lib/actions";

const inputCls =
  "mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent";
const btnCls =
  "rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50";

export default function SetupTab({
  contest,
  players,
}: {
  contest: ContestInfo;
  players: PlayerStats[];
}) {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const contestReady = Boolean(contest.startDate);

  function handleAdd(form: FormData) {
    start(async () => {
      const res = await addPlayer(form);
      setMsg(res.ok ? { kind: "ok", text: "Player added." } : { kind: "err", text: res.error! });
    });
  }

  function handleContest(form: FormData) {
    start(async () => {
      const res = await saveContest(form);
      setMsg(res.ok ? { kind: "ok", text: "Contest saved." } : { kind: "err", text: res.error! });
    });
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — Contest (outermost layer) */}
      <section className="panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <Step n={1} done={contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Contest dates</h2>
        </div>
        <form action={handleContest} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="text-muted">Start date</span>
            <input type="date" name="startDate" defaultValue={contest.startDate ?? ""} className={inputCls} />
          </label>
          <label className="flex-1 text-sm">
            <span className="text-muted">End date</span>
            <input type="date" name="endDate" defaultValue={contest.endDate ?? ""} className={inputCls} />
          </label>
          <button disabled={pending} className={btnCls}>
            {contestReady ? "Update" : "Start contest"}
          </button>
        </form>
      </section>

      {/* Step 2 — Players (locked until a contest exists) */}
      <section className={`panel p-5 ${contestReady ? "" : "pointer-events-none opacity-50"}`}>
        <div className="mb-3 flex items-center gap-2">
          <Step n={2} done={players.length > 0} locked={!contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Register players</h2>
        </div>

        {!contestReady ? (
          <p className="text-sm text-muted">Set the contest dates above to unlock this step.</p>
        ) : (
          <>
            <form action={handleAdd} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 text-sm">
                <span className="text-muted">Display name</span>
                <input name="name" className={inputCls} />
              </label>
              <label className="flex-1 text-sm">
                <span className="text-muted">GitHub username</span>
                <input name="githubLogin" className={inputCls} />
              </label>
              <label className="flex-1 text-sm">
                <span className="text-muted">Access token</span>
                <input name="token" type="password" className={inputCls} />
              </label>
              <button disabled={pending} className={btnCls}>
                {pending ? "Verifying…" : "Add"}
              </button>
            </form>
            <p className="mt-2 text-xs text-muted">
              Token is encrypted (AES-256-GCM) before storage and never sent to the browser.
            </p>
          </>
        )}
      </section>

      {/* Message banner */}
      {msg && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            msg.kind === "ok"
              ? "border-success/40 bg-success/10 text-success"
              : "border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Registered players */}
      {contestReady && (
        <section className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Registered players ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="text-sm text-muted">No players yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium text-fg">{p.name}</span>{" "}
                    <span className="text-muted">@{p.githubLogin}</span>
                  </span>
                  <button
                    onClick={() => start(() => deletePlayer(p.id))}
                    disabled={pending}
                    className="text-xs text-danger hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Step({ n, done, locked }: { n: number; done?: boolean; locked?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
        locked
          ? "bg-panel2 text-muted"
          : done
          ? "bg-success text-bg"
          : "bg-accent text-bg"
      }`}
    >
      {done && !locked ? "✓" : n}
    </span>
  );
}
