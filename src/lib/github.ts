import { graphql } from "@octokit/graphql";
import { istDayStart, istDayEnd } from "./time";

// ── Why this approach ───────────────────────────────────────────────────────
// We score COMMITS ONLY (not the green-square calendar, which also counts PRs/
// issues/reviews). GitHub's `totalCommitContributions` is the authoritative
// commit-only count for a date range — it's the same number GitHub computes
// server-side and is robust to private/non-enumerable repos (unlike
// `commitContributionsByRepository`, which silently undercounts repos a token
// can't list). To get a per-DAY breakdown we query it once per day, batched into
// a single request via GraphQL field aliases.
//
// `contributionsCollection` accepts a max 1-year window. A contest window fits
// easily; the all-time cumulative total loops year-by-year from account creation.
// ─────────────────────────────────────────────────────────────────────────────

export type DailyCount = { date: string; count: number };

const DAYS_PER_REQUEST = 50; // keep each aliased query well under GraphQL limits

function client(token: string) {
  return graphql.defaults({ headers: { authorization: `token ${token}` } });
}

function daysBetween(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  for (
    let d = new Date(`${startDate}T00:00:00Z`);
    d <= new Date(`${endDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** GitHub account creation date — bounds the all-time year-loop. */
export async function fetchAccountCreated(token: string, login: string): Promise<string> {
  const res = await client(token)<{ user: { createdAt: string } | null }>(
    `query($login:String!){ user(login:$login){ createdAt } }`,
    { login }
  );
  if (!res.user) throw new Error(`GitHub user "${login}" not found, or token lacks access.`);
  return res.user.createdAt;
}

/**
 * Commit-only daily counts for the inclusive day range [startDate, endDate]
 * (YYYY-MM-DD, window <= 1 year). Queries `totalCommitContributions` per day via
 * aliased fields, batched. Returns only days with at least one commit.
 */
export async function fetchDailyCommits(
  token: string,
  login: string,
  startDate: string,
  endDate: string
): Promise<DailyCount[]> {
  const gql = client(token);
  const days = daysBetween(startDate, endDate);
  const out: DailyCount[] = [];

  for (let i = 0; i < days.length; i += DAYS_PER_REQUEST) {
    const batch = days.slice(i, i + DAYS_PER_REQUEST);
    const fields = batch
      .map(
        // IST day boundaries so commits bucket by IST midnight, not UTC.
        (day, j) =>
          `d${j}: contributionsCollection(from:${JSON.stringify(istDayStart(day))},to:${JSON.stringify(
            istDayEnd(day)
          )}){ totalCommitContributions }`
      )
      .join("\n");

    const res = await gql<{ user: Record<string, { totalCommitContributions: number }> | null }>(
      `query($login:String!){ user(login:$login){ ${fields} } }`,
      { login }
    );
    if (!res.user) throw new Error(`GitHub user "${login}" not found.`);

    batch.forEach((day, j) => {
      const count = res.user![`d${j}`]?.totalCommitContributions ?? 0;
      if (count > 0) out.push({ date: day, count });
    });
  }
  return out;
}

/** All-time cumulative commit count: sum of totalCommitContributions per year. */
export async function fetchTotalCommits(
  token: string,
  login: string,
  accountCreatedISO: string
): Promise<number> {
  const gql = client(token);
  let total = 0;
  let cursor = new Date(accountCreatedISO);
  const now = new Date();

  while (cursor < now) {
    const from = new Date(cursor);
    const to = new Date(cursor);
    to.setFullYear(to.getFullYear() + 1);
    const windowEnd = to < now ? to : now;

    const res = await gql<{
      user: { contributionsCollection: { totalCommitContributions: number } } | null;
    }>(
      `query($login:String!,$from:DateTime!,$to:DateTime!){
         user(login:$login){
           contributionsCollection(from:$from,to:$to){ totalCommitContributions }
         }
       }`,
      { login, from: from.toISOString(), to: windowEnd.toISOString() }
    );
    total += res.user?.contributionsCollection.totalCommitContributions ?? 0;
    cursor = to;
  }
  return total;
}
