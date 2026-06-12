import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildPositions, rebuildCandidates } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open list so the board can show live role status, applicant counts, and
// the character-sheet detail (mandate, current tasks). Candidate identities
// and pay stay behind the Rebuild gate.
export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(rebuildPositions);
    const counts = await db
      .select({ positionId: rebuildCandidates.positionId, n: sql<number>`count(*)::int` })
      .from(rebuildCandidates)
      .groupBy(rebuildCandidates.positionId);
    const countMap = new Map(counts.map((c) => [c.positionId, c.n]));
    return NextResponse.json({
      positions: rows.map((p) => ({
        id: p.id, title: p.title, status: p.status,
        applicantCount: countMap.get(p.id) ?? 0,
        mandate: p.mandate,
        tasksNow: (p.tasksNow as string[]) ?? [],
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
