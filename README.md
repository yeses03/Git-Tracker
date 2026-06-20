# Git Tracker — Commit Arena

A web app where players compete on GitHub commits. Register players with a GitHub
token, set a contest window, and watch a live leaderboard, stat cards, and charts
of daily and cumulative commits.

## Features

- **Layered setup** — create a contest (start/end dates) first, then register players.
- **Two commit metrics**
  - **Cumulative total** — all commits ever made on the account.
  - **Competition score** — commits made within the contest window `[start, end]`
    (both endpoints inclusive). Backfilled from the start date and updated live.
- **Stats tab** — a card per player: competition score, all-time total, today's
  commits, and best single day.
- **Graphs tab** — a Daily/Cumulative toggle (grouped bar chart + cumulative line
  chart, GitHub-dark theme) plus a leaderboard.
- **Secure tokens** — GitHub tokens are AES-256-GCM encrypted at rest and never
  sent to the browser. All GitHub calls run server-side.

## Tech stack

- **Next.js (App Router) + TypeScript** — UI and server actions/route handlers.
- **Prisma + SQLite** — storage. Switching to Supabase/Postgres is a one-line
  `datasource` change in `prisma/schema.prisma`.
- **Chart.js (react-chartjs-2)** — the two charts.
- **@octokit/graphql** — GitHub GraphQL client.
- **Tailwind CSS** — styling.

## How commit data is collected (the important part)

GitHub's contribution **calendar** (the green squares) counts *all* contributions —
commits **plus** pull requests, issues, and reviews — so it cannot be used for a
commits-only contest. Instead we use GitHub's authoritative **`totalCommitContributions`**
field, which is a true commit-only count for a date range.

- **Daily commits** — `totalCommitContributions` is queried **once per day** over
  the contest window, batched into a single request via GraphQL field aliases
  (`d0:`, `d1:`, …). This is commit-only and robust to private / non-enumerable
  repos. (An earlier approach using `commitContributionsByRepository` was dropped
  because it silently returns 0 for repos a token can't list.)
- **All-time cumulative total** — `contributionsCollection` is capped at a 1-year
  window, so the total loops year-by-year from the account's `createdAt`, summing
  each year's `totalCommitContributions`.

See [`src/lib/github.ts`](src/lib/github.ts).

### Scoring

- **Competition score** = sum of daily commit counts where `start <= date <= end`
  (closed interval — start and end days both count). No baseline is subtracted.
- The fetch window spans `start 00:00:00Z → min(end, today) 23:59:59Z`, so the end
  day fully tallies once it arrives.
- See [`src/lib/scores.ts`](src/lib/scores.ts).

### Refresh model

Data refreshes **on page load**, guarded by a 5-minute staleness check
([`src/lib/sync.ts`](src/lib/sync.ts)): opening the dashboard only re-hits GitHub
for players whose data is older than 5 minutes; otherwise cached data is served.
Each player authenticates with their own token, so rate limits never collide.

## Project layout

```
src/
  app/            Next.js routes (page.tsx triggers the staleness-guarded sync)
  components/     Dashboard (3 tabs), SetupTab, StatsTab, GraphsTab
  lib/
    github.ts     GitHub GraphQL fetchers (commit-only daily + all-time total)
    sync.ts       Per-player refresh + staleness guard
    scores.ts     Leaderboard + graph aggregation
    crypto.ts     AES-256-GCM token encryption
    prisma.ts     Prisma client singleton
    actions.ts    Server actions (add/delete player, save contest)
prisma/schema.prisma        Player, CommitDaily, Contest models
scripts/debug-commits.mjs   Diagnostic: prints per-day commit counts from GitHub
```

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# then set ENCRYPTION_KEY (see the comment in .env.example for how to generate one)

# 3. Create the database
npx prisma db push

# 4. Run
npm run dev   # → http://localhost:3000
```

Then in the app:

1. Open the **Setup** tab and save a contest **start** and **end** date.
2. Register players: display name, GitHub username, and a
   [personal access token](https://github.com/settings/tokens). A classic token
   with `repo` + `read:user` scope is recommended so private-repo commits are counted.
3. View the **Stats** and **Graphs** tabs.

## Diagnostics

To see exactly what GitHub reports per day for the registered players:

```bash
node --env-file=.env scripts/debug-commits.mjs
```

## Security notes

- `.env` (holds `ENCRYPTION_KEY`) and `prisma/dev.db` (holds encrypted tokens) are
  gitignored — never commit them.
- Changing `ENCRYPTION_KEY` makes previously stored tokens undecryptable; players
  would need to be re-added.
- The app has no authentication — it is intended for trusted/internal use.

## Switching to Supabase / Postgres

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` to your Postgres/Supabase connection string.
3. Run `npx prisma db push`.
