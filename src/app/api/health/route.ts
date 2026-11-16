import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Uptime check: 200 when the app can reach its database, 503 otherwise. No data exposed. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (e) {
    console.error("[health] database check failed:", e);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
