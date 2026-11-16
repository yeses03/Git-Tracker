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
- **Prisma + PostgreSQL** — storage (Supabase, Neon, Vercel Postgres, or local).
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
- Days are bucketed in **IST (UTC+05:30)**: each day is queried as
  `00:00:00+05:30 → 23:59:59+05:30`, over `start → min(end, today)`.
- See [`src/lib/scores.ts`](src/lib/scores.ts).

### Refresh model

Data refreshes **after the response** on page load, guarded by a 5-minute staleness
check ([`src/lib/sync.ts`](src/lib/sync.ts)): the page renders instantly from the
database, then (via `after()`) re-hits GitHub only for players whose data is older
than 5 minutes. Concurrent visitors don't double-sync (the refresh is atomically
claimed). Saving new contest dates triggers an immediate re-sync.
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
    auth.ts       Admin password + signed session cookie
    actions.ts    Server actions (login, add/delete player, save contest) — all admin-guarded
prisma/schema.prisma        Player, CommitDaily, Contest models
scripts/debug-commits.mjs   Diagnostic: prints per-day commit counts from GitHub
```

## Getting started (local)

```bash
npm install
cp .env.example .env     # then fill in DATABASE_URL, DIRECT_URL, ENCRYPTION_KEY, ADMIN_PASSWORD
npx prisma db push       # create tables in your Postgres
npm run dev              # → http://localhost:3000
```

Then open the **Admin** tab, sign in with `ADMIN_PASSWORD`, and:

1. Save a contest **start** and **end** date.
2. Register players: display name, GitHub username, and that user's own
   [personal access token](https://github.com/settings/tokens) (classic, `repo` +
   `read:user` so private-repo commits count). The token must belong to the username
   entered — it is verified on add.

Anyone can view the **Stats** and **Graphs** tabs; only the admin can change anything.

## Deploying to production (Vercel)

1. **Database** — create a Postgres DB (Supabase/Neon/Vercel Postgres). Run
   `npx prisma db push` once, locally, with `DATABASE_URL`/`DIRECT_URL` pointed at it.
2. **Import the repo** in Vercel and set these environment variables
   (see `.env.example`): `DATABASE_URL` (pooled), `DIRECT_URL` (direct),
   `ENCRYPTION_KEY` (**new** 64-hex key), `ADMIN_PASSWORD` (long & random),
   `NEXT_PUBLIC_SITE_URL` (your domain).
3. Deploy. `npm run build` runs `prisma generate` automatically.
4. Open the site, sign in under **Admin**, set the contest, and re-add players
   (tokens are encrypted with the key, so they don't carry over from a different one).

## Security notes

- Server actions are public HTTP endpoints, so **each one re-checks the admin session**;
  hiding the UI is not relied upon.
- Admin session = HMAC-signed, expiring (7 days), `httpOnly`, `sameSite=strict`,
  `secure` cookie. Rotating `ADMIN_PASSWORD` or `ENCRYPTION_KEY` signs everyone out.
- GitHub tokens are AES-256-GCM encrypted at rest and never sent to the browser.
  Changing `ENCRYPTION_KEY` makes stored tokens undecryptable.
- Security headers (HSTS, no-framing, nosniff, referrer policy) are set in `next.config.ts`.
- Never commit `.env`; `.env.example` is the only env file tracked.

## Diagnostics

To see exactly what GitHub reports per day for the registered players:

```bash
node --env-file=.env scripts/debug-commits.mjs
```
