"use client";

import { useState, useTransition } from "react";
import type { ContestInfo, PlayerStats } from "@/lib/scores";
import { addPlayer, deletePlayer, saveContest } from "@/lib/actions";

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
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Step 1 — Contest (outermost layer) */}
      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <Step n={1} done={contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Contest dates
          </h2>
        </div>
        <form action={handleContest} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="text-zinc-500">Start date</span>
            <input
              type="date"
              name="startDate"
              defaultValue={contest.startDate ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="text-zinc-500">End date</span>
            <input
              type="date"
              name="endDate"
              defaultValue={contest.endDate ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
          </label>
          <button
            disabled={pending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {contestReady ? "Update" : "Start contest"}
          </button>
        </form>
      </section>

      {/* Step 2 — Players (locked until a contest exists) */}
      <section
        className={`rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 ${
          contestReady ? "" : "pointer-events-none opacity-50"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Step n={2} done={players.length > 0} locked={!contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Register players
          </h2>
        </div>

        {!contestReady ? (
          <p className="text-sm text-zinc-500">Set the contest dates above to unlock this step.</p>
        ) : (
          <>
            <form action={handleAdd} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 text-sm">
                <span className="text-zinc-500">Display name</span>
                <input
                  name="name"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                />
              </label>
              <label className="flex-1 text-sm">
                <span className="text-zinc-500">GitHub username</span>
                <input
                  name="githubLogin"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                />
              </label>
              <label className="flex-1 text-sm">
                <span className="text-zinc-500">Access token</span>
                <input
                  name="token"
                  type="password"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                />
              </label>
              <button
                disabled={pending}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {pending ? "Verifying…" : "Add"}
              </button>
            </form>
            <p className="mt-2 text-xs text-zinc-500">
              Token is encrypted (AES-256-GCM) before storage and never sent to the browser.
            </p>
          </>
        )}
      </section>

      {/* Message banner */}
      {msg && (
        <div
          className={`rounded-md px-4 py-2 text-sm ${
            msg.kind === "ok"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Registered players */}
      {contestReady && (
        <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Registered players ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="text-sm text-zinc-500">No players yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium">{p.name}</span>{" "}
                    <span className="text-zinc-500">@{p.githubLogin}</span>
                  </span>
                  <button
                    onClick={() => start(() => deletePlayer(p.id))}
                    disabled={pending}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
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
          ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
          : done
          ? "bg-emerald-500 text-white"
          : "bg-black text-white dark:bg-white dark:text-black"
      }`}
    >
      {done && !locked ? "✓" : n}
    </span>
  );
}
