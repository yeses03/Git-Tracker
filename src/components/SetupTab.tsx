"use client";

import { useState, useTransition, type CSSProperties } from "react";
import type { ContestInfo, PlayerStats } from "@/lib/scores";
import { addPlayer, deletePlayer, saveContest, login, logout } from "@/lib/actions";

export default function SetupTab({
  contest,
  players,
  isAdmin,
}: {
  contest: ContestInfo;
  players: PlayerStats[];
  isAdmin: boolean;
}) {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const contestReady = Boolean(contest.startDate);

  function handleAdd(form: FormData) {
    start(async () => {
      const res = await addPlayer(form);
      setMsg(
        !res.ok
          ? { kind: "err", text: res.error ?? "Something went wrong." }
          : { kind: "ok", text: res.error ?? "Player added." }, // ok + error = added with a warning
      );
    });
  }

  function handleLogin(form: FormData) {
    start(async () => {
      const res = await login(form);
      setMsg(res.ok ? null : { kind: "err", text: res.error ?? "Sign-in failed." });
    });
  }

  function handleRemove(id: string) {
    start(async () => {
      const res = await deletePlayer(id);
      if (!res.ok) setMsg({ kind: "err", text: res.error ?? "Failed to remove player." });
    });
  }

  function handleContest(form: FormData) {
    start(async () => {
      const res = await saveContest(form);
      setMsg(res.ok ? { kind: "ok", text: "Contest saved." } : { kind: "err", text: res.error ?? "Something went wrong." });
    });
  }

  if (!isAdmin) {
    return (
      <section className="card mx-auto max-w-md p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Admin sign-in</h2>
        <p className="mb-4 text-sm text-muted">
          Only the contest admin can change dates or manage players.
        </p>
        <form action={handleLogin} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <input type="password" name="password" required autoComplete="current-password" className="field" />
          </label>
          <button disabled={pending} className="btn">
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-red">{msg.text}</p>}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => start(() => logout())} disabled={pending} className="text-xs text-muted hover:underline">
          Sign out
        </button>
      </div>

      {/* Step 1 — Contest (outermost layer) */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Step n={1} done={contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Contest dates</h2>
        </div>
        <form action={handleContest} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted">Start date</span>
            <input type="date" name="startDate" required defaultValue={contest.startDate ?? ""} className="field" />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-muted">End date</span>
            <input type="date" name="endDate" defaultValue={contest.endDate ?? ""} className="field" />
          </label>
          <button disabled={pending} className="btn">
            {contestReady ? "Update" : "Start contest"}
          </button>
        </form>
      </section>

      {/* Step 2 — Players (locked until a contest exists) */}
      <section className={`card p-6 ${contestReady ? "" : "pointer-events-none opacity-50"}`}>
        <div className="mb-4 flex items-center gap-2.5">
          <Step n={2} done={players.length > 0} locked={!contestReady} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Register players</h2>
        </div>

        {!contestReady ? (
          <p className="text-sm text-muted">Set the contest dates above to unlock this step.</p>
        ) : (
          <>
            <form action={handleAdd} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 text-sm">
                <span className="mb-1 block text-muted">Display name</span>
                <input name="name" required maxLength={60} className="field" />
              </label>
              <label className="flex-1 text-sm">
                <span className="mb-1 block text-muted">GitHub username</span>
                <input name="githubLogin" required maxLength={40} autoCapitalize="none" autoCorrect="off" className="field" />
              </label>
              <label className="flex-1 text-sm">
                <span className="mb-1 block text-muted">Access token</span>
                <input name="token" type="password" required autoComplete="off" className="field" />
              </label>
              <button disabled={pending} className="btn">
                {pending ? "Verifying…" : "Add"}
              </button>
            </form>
            <p className="mt-3 text-xs text-muted">
              Token is encrypted (AES-256-GCM) before storage and never sent to the browser.
            </p>
          </>
        )}
      </section>

      {/* Message banner */}
      {msg && (
        <div
          className="rounded px-4 py-3 text-sm"
          style={
            {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${msg.kind === "ok" ? "var(--green)" : "var(--red)"}`,
              color: msg.kind === "ok" ? "var(--green)" : "var(--red)",
            } as CSSProperties
          }
        >
          {msg.text}
        </div>
      )}

      {/* Registered players */}
      {contestReady && (
        <section className="card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Registered players ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="text-sm text-muted">No players yet.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span>
                    <span className="font-medium text-ink">{p.name}</span>{" "}
                    <span className="text-muted">@{p.githubLogin}</span>
                  </span>
                  <button
                    onClick={() => handleRemove(p.id)}
                    disabled={pending}
                    className="text-xs font-medium text-red hover:underline disabled:opacity-50"
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
  const style: CSSProperties = locked
    ? { background: "var(--surface-2)", color: "var(--muted)" }
    : done
    ? { background: "var(--green)", color: "#fff" }
    : { background: "var(--blue)", color: "#fff" };
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
      style={style}
    >
      {done && !locked ? "✓" : n}
    </span>
  );
}
