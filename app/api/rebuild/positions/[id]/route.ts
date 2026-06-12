import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildPositions, rebuildCandidates, rebuildEvents } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent, slugify, POSITION_STATUSES } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Entity page loads position + applicants + history in one call.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [position] = await db.select().from(rebuildPositions).where(eq(rebuildPositions.id, params.id));
    if (!position) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const candidates = await db.select().from(rebuildCandidates)
      .where(eq(rebuildCandidates.positionId, params.id))
      .orderBy(desc(rebuildCandidates.updatedAt));
    const events = await db.select().from(rebuildEvents)
      .where(eq(rebuildEvents.positionId, params.id))
      .orderBy(desc(rebuildEvents.createdAt))
      .limit(100);
    return NextResponse.json({ position, candidates, events });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

const FIELDS = [
  "title", "mandate", "payRampNote", "cadence", "budgetNote", "jobPost", "trackerUrl",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const body = await req.json().catch(() => ({}));

    const [current] = await db.select().from(rebuildPositions).where(eq(rebuildPositions.id, params.id));
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Optimistic concurrency: last write wins per field, but a stale full save
    // gets a 409 so the client can refresh instead of clobbering.
    if (body.expectedUpdatedAt && new Date(body.expectedUpdatedAt).getTime() !== current.updatedAt.getTime()) {
      return NextResponse.json({ error: "conflict", updatedBy: current.updatedBy }, { status: 409 });
    }

    const patch: Record<string, unknown> = { updatedAt: new Date(), updatedBy: actor };
    for (const k of FIELDS) if (body[k] !== undefined) patch[k] = body[k] === "" ? null : body[k];
    if (body.title) patch.slug = slugify(body.title);
    for (const k of ["tasksNow", "tasksLater", "kpis"] as const) {
      if (Array.isArray(body[k])) patch[k] = body[k];
    }
    for (const k of ["payMin", "payMax"] as const) {
      if (body[k] !== undefined) patch[k] = body[k] === null || body[k] === "" ? null : Math.round(Number(body[k]));
    }

    // Status transitions write their own events.
    if (body.status && POSITION_STATUSES.includes(body.status)) {
      patch.status = body.status;
      if (body.status === "active" && current.status !== "active") {
        patch.activatedAt = new Date();
        await writeRebuildEvent({ positionId: current.id, type: "activated", payload: {}, actor });
        if (body.jobPost) await writeRebuildEvent({ positionId: current.id, type: "post_attached", payload: {}, actor });
        if (body.trackerUrl) await writeRebuildEvent({ positionId: current.id, type: "tracker_attached", payload: { url: body.trackerUrl }, actor });
      } else if (body.status === "paused") {
        await writeRebuildEvent({ positionId: current.id, type: "paused", payload: {}, actor });
      } else if (body.status === "filled") {
        await writeRebuildEvent({ positionId: current.id, type: "filled", payload: {}, actor });
      }
    } else if (Object.keys(patch).length > 2) {
      await writeRebuildEvent({
        positionId: current.id, type: "edited",
        payload: { fields: Object.keys(patch).filter((k) => !["updatedAt", "updatedBy", "slug"].includes(k)) },
        actor,
      });
    }

    const [row] = await db.update(rebuildPositions).set(patch).where(eq(rebuildPositions.id, params.id)).returning();
    return NextResponse.json({ position: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
