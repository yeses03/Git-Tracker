// Diagnostic: verify per-day commit-only counts (totalCommitContributions per day).
// Run: node --env-file=.env scripts/debug-commits.mjs
import { PrismaClient } from "@prisma/client";
import { graphql } from "@octokit/graphql";
import crypto from "crypto";

function decryptToken(payload) {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  d.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([d.update(Buffer.from(dataHex, "hex")), d.final()]).toString("utf8");
}

const IST_OFFSET = "+05:30";
const prisma = new PrismaClient();
const contest = await prisma.contest.findUnique({ where: { id: 1 } });
const players = await prisma.player.findMany();
const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // IST
const start = contest?.startDate ?? today;
const end = contest?.endDate && contest.endDate < today ? contest.endDate : today;

const days = [];
for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1))
  days.push(d.toISOString().slice(0, 10));
console.log(`Window: ${start} → ${end}\n`);

for (const p of players) {
  const token = decryptToken(p.tokenEncrypted);
  const gql = graphql.defaults({ headers: { authorization: `token ${token}` } });
  const fields = days
    .map((day, j) => `d${j}: contributionsCollection(from:${JSON.stringify(`${day}T00:00:00${IST_OFFSET}`)},to:${JSON.stringify(`${day}T23:59:59${IST_OFFSET}`)}){ totalCommitContributions }`)
    .join("\n");
  const res = await gql(`query($login:String!){ user(login:$login){ ${fields} } }`, { login: p.githubLogin });

  const perDay = days.map((day, j) => res.user[`d${j}`].totalCommitContributions);
  console.log(`=== ${p.name} (@${p.githubLogin}) ===`);
  days.forEach((day, j) => console.log(`  ${day}  ${String(perDay[j]).padStart(4)}`));
  console.log(`  TOTAL ${perDay.reduce((a, b) => a + b, 0)}\n`);
}

await prisma.$disconnect();
