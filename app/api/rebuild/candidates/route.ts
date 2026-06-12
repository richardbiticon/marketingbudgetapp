import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildCandidates } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent, STAGES } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const conds = [];
    const position = sp.get("position");
    const stage = sp.get("stage");
    const q = sp.get("q");
    if (position) conds.push(eq(rebuildCandidates.positionId, position));
    if (stage) conds.push(eq(rebuildCandidates.stage, stage));
    if (q) conds.push(or(ilike(rebuildCandidates.name, `%${q}%`), ilike(rebuildCandidates.email, `%${q}%`)));
    const rows = await db.select().from(rebuildCandidates)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(rebuildCandidates.updatedAt));
    return NextResponse.json({ candidates: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const b = await req.json().catch(() => ({}));
    if (!b.name || typeof b.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const stage = STAGES.includes(b.stage) ? b.stage : "applied";
    const [row] = await db.insert(rebuildCandidates).values({
      positionId: b.positionId ?? null,
      name: b.name.trim().slice(0, 120),
      email: b.email || null,
      location: b.location || null,
      expectedSalary: b.expectedSalary ? Math.round(Number(b.expectedSalary)) : null,
      portfolioUrl: b.portfolioUrl || null,
      oljProfileUrl: b.oljProfileUrl || null,
      resumeUrl: b.resumeUrl || null,
      stage,
      scores: b.scores ?? null,
      profile: b.profile ?? null,
      sourcePdfUrl: b.sourcePdfUrl || null,
      source: b.source === "pdf" || b.source === "csv" ? b.source : "manual",
      notes: b.notes || null,
      updatedBy: actor,
    }).returning();
    await writeRebuildEvent({
      positionId: row.positionId, candidateId: row.id, type: "candidate_added",
      payload: { name: row.name, stage: row.stage }, actor,
    });
    return NextResponse.json({ candidate: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
