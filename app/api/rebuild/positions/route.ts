import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildPositions, rebuildCandidates } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent, slugify } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(rebuildPositions).orderBy(desc(rebuildPositions.updatedAt));
    const counts = await db
      .select({ positionId: rebuildCandidates.positionId, n: sql<number>`count(*)::int` })
      .from(rebuildCandidates)
      .groupBy(rebuildCandidates.positionId);
    const countMap = new Map(counts.map((c) => [c.positionId, c.n]));
    return NextResponse.json({
      positions: rows.map((p) => ({ ...p, applicantCount: countMap.get(p.id) ?? 0 })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Untitled position";
    const [row] = await db.insert(rebuildPositions).values({
      title, slug: slugify(title), status: "draft", updatedBy: actor,
    }).returning();
    await writeRebuildEvent({ positionId: row.id, type: "created", payload: { title }, actor });
    return NextResponse.json({ position: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
