import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildCandidates } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent, STAGES } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db.select().from(rebuildCandidates).where(eq(rebuildCandidates.id, params.id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ candidate: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

const FIELDS = [
  "name", "email", "location", "portfolioUrl", "oljProfileUrl", "resumeUrl", "notes", "sourcePdfUrl",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const b = await req.json().catch(() => ({}));
    const [current] = await db.select().from(rebuildCandidates).where(eq(rebuildCandidates.id, params.id));
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch: Record<string, unknown> = { updatedAt: new Date(), updatedBy: actor };
    for (const k of FIELDS) if (b[k] !== undefined) patch[k] = b[k] === "" ? null : b[k];
    if (b.expectedSalary !== undefined) patch.expectedSalary = b.expectedSalary ? Math.round(Number(b.expectedSalary)) : null;
    if (b.positionId !== undefined) patch.positionId = b.positionId || null;
    if (b.scores !== undefined) patch.scores = b.scores;
    if (b.profile !== undefined) patch.profile = b.profile;

    if (b.stage && STAGES.includes(b.stage) && b.stage !== current.stage) {
      patch.stage = b.stage;
      await writeRebuildEvent({
        positionId: (b.positionId ?? current.positionId) as string | null, candidateId: current.id,
        type: b.stage === "hired" ? "hired" : "stage_changed",
        payload: { name: current.name, from: current.stage, to: b.stage }, actor,
      });
    }

    const [row] = await db.update(rebuildCandidates).set(patch).where(eq(rebuildCandidates.id, params.id)).returning();
    return NextResponse.json({ candidate: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db.delete(rebuildCandidates).where(eq(rebuildCandidates.id, params.id)).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await writeRebuildEvent({
      positionId: row.positionId, candidateId: row.id, type: "note",
      payload: { text: `removed candidate ${row.name}` }, actor: actorFrom(req),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
