# Commit Arena

**Live site: https://git-tracker-tqxb.onrender.com/**

A leaderboard for friendly GitHub commit contests. Pick a start and end date, add
players, and the site tracks every player's commits: who is leading, who committed
today, daily and cumulative charts, and which repositories the commits went to.

Anyone with the link can **view** the standings. Only the admin (password-protected)
can change the contest dates or add and remove players.

## Features

- **Today** — greeting, live moon phase, who has committed today, and standings with
  progress bars relative to the leader.
- **Players** — a card per player: contest score, all-time total, today's commits, best
  single day, and **commits by repository** (GitHub's "contribution activity").
  Private repositories are shown only as "Private repositories" — names never leak.
- **Graphs** — daily bar chart and cumulative line chart over a 5-day window, plus a
  full leaderboard table.
- **Admin** — set the contest window, register and remove players.
- **Two metrics** — *contest score* (commits inside the window, both end dates inclusive)
  and *all-time total* (every commit on the account).
- **Secure by design** — GitHub tokens are AES-256-GCM encrypted at rest and never reach
  the browser; the admin area is protected by a signed session cookie.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) + TypeScript |
| Database | PostgreSQL (Supabase) via Prisma |
| GitHub data | `@octokit/graphql` |
| Charts | Chart.js (`react-chartjs-2`) |
| Styling | Tailwind CSS 4 + CSS design tokens ("Moonlit Minimal": solid navy surfaces, lavender accent, no glass effects) |
| Hosting | Render (blueprint in [`render.yaml`](render.yaml)) |

## How commit data is collected

GitHub's contribution **calendar** (the green squares) counts everything — commits plus
PRs, issues and reviews — so it can't score a commits-only contest. Instead the app uses
GitHub's **`totalCommitContributions`**, a true commit-only count for a date range
([`src/lib/github.ts`](src/lib/github.ts)):

- **Daily commits** — queried once per day across the contest window, batched into
  aliased GraphQL requests. Days are bucketed in **IST (UTC+05:30)**.
- **All-time total** — `contributionsCollection` is capped at one year, so the total
  loops year by year from the account's creation date.
- **Commits by repository** — `commitContributionsByRepository` over the contest window.
  This is *informational only*: GitHub's API can't itemise some commits by repo, so the
  gap is shown as an explicit "Other (not itemised by GitHub)" row. The **score always
  comes from the daily totals**, never from this list.
- **Token check** — when a player is added, the token must belong to the username
  entered, so nobody can register someone else's account.

### Refresh model

The page renders instantly from the database. Then, after the response (`after()`),
players whose data is older than **5 minutes** are refreshed from GitHub
([`src/lib/sync.ts`](src/lib/sync.ts)). The refresh is atomically claimed, so concurrent
visitors never double-sync. Saving new contest dates triggers an immediate re-sync.

## Project layout

```
src/
  app/              Routes: page (Today/Players/Graphs/Admin), /api/health, icon, error pages
  components/       Dashboard shell, Sidebar, Overview/Stats/Graphs/Setup tabs, Celestial (SVG art)
  lib/
    github.ts       GitHub GraphQL fetchers
    sync.ts         Per-player refresh + staleness claim
    scores.ts       Leaderboard + graph aggregation
    actions.ts      Server actions (login, add/remove player, save contest) — all admin-guarded
    auth.ts         Admin password + signed session cookie
    crypto.ts       AES-256-GCM token encryption
    moon.ts         Moon phase from the date
    time.ts         IST date helpers
prisma/schema.prisma   Player, CommitDaily, RepoCommit, Contest
render.yaml            Render deployment blueprint
scripts/debug-commits.mjs   Prints per-day commit counts straight from GitHub
```

## Run it locally

```bash
npm install
cp .env.example .env     # fill in the values (see below)
docker compose up -d     # local Postgres — or point .env at any Postgres
npx prisma db push       # create the tables
npm run dev              # → http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection used at runtime (pooled on serverless/Supabase) |
| `DIRECT_URL` | Direct connection used by `prisma db push` |
| `ENCRYPTION_KEY` | 64 hex chars; encrypts stored GitHub tokens. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | Password for the Admin area |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (link previews) |

## Using it

1. Open **Admin** and sign in with `ADMIN_PASSWORD`.
2. Save a contest **start** and **end** date.
3. Add each player: display name, exact GitHub username, and **that person's own**
   [classic personal access token](https://github.com/settings/tokens) with `repo` and
   `read:user` (`repo` lets private-repo commits count).

## Deploying (Render)

1. Create a Postgres database (Supabase/Neon) and run `npx prisma db push` once against it.
2. Render → **New → Blueprint** → pick this repo. [`render.yaml`](render.yaml) sets the
   build, start and health check (`/api/health`) and asks for the secrets.
3. Set `DATABASE_URL` (pooled), `DIRECT_URL` (same value as `DATABASE_URL` — Supabase's
   direct host is IPv6-only), `ENCRYPTION_KEY`, `ADMIN_PASSWORD` and `NEXT_PUBLIC_SITE_URL`.
4. Every push to `main` redeploys automatically.

Notes: the free plan sleeps after ~15 minutes idle (first visit takes 30–60 s). Reusing
the same database **and** `ENCRYPTION_KEY` keeps existing players; a new key means
re-adding them. The app also runs on Vercel, where syncs are capped at 60 s on the free tier.

## Security

- Server Actions are public endpoints, so **every one re-checks the admin session**.
- Admin session: HMAC-signed, expiring (7 days), `httpOnly`, `sameSite=strict`, `secure`.
  Changing `ADMIN_PASSWORD` or `ENCRYPTION_KEY` signs everyone out.
- Tokens are encrypted at rest. Changing `ENCRYPTION_KEY` makes stored tokens
  undecryptable.
- HSTS, no-framing, nosniff and referrer-policy headers are set in `next.config.ts`.
- Never commit `.env`; only `.env.example` is tracked.

## Diagnostics

```bash
node --env-file=.env scripts/debug-commits.mjs   # per-day commit counts from GitHub
```

CI (typecheck, lint, build) runs on every push via GitHub Actions.
