import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rebuildPositions } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Board actions reflect into the hiring room:
// - action "hired"  -> the linked position is marked filled
// - action "needed" -> the linked position reopens as active
// - addTasks        -> appended to the position's tasks now list
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const { positionId, action, addTasks } = await req.json().catch(() => ({}));
    if (!positionId) return NextResponse.json({ error: "positionId required" }, { status: 400 });
    const [current] = await db.select().from(rebuildPositions).where(eq(rebuildPositions.id, positionId));
    if (!current) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const patch: Record<string, unknown> = { updatedAt: new Date(), updatedBy: actor };

    if (action === "hired") {
      patch.status = "filled";
      await writeRebuildEvent({ positionId, type: "filled", payload: { via: "machine" }, actor });
    } else if (action === "needed") {
      patch.status = "active";
      await writeRebuildEvent({ positionId, type: "activated", payload: { via: "machine" }, actor });
    }

    if (Array.isArray(addTasks) && addTasks.length) {
      const clean = addTasks.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20);
      const existing = (current.tasksNow as string[]) ?? [];
      patch.tasksNow = [...existing, ...clean.filter((t) => !existing.includes(t))];
      await writeRebuildEvent({ positionId, type: "edited", payload: { fields: ["tasksNow"], via: "machine" }, actor });
    }

    const [row] = await db.update(rebuildPositions).set(patch).where(eq(rebuildPositions.id, positionId)).returning();
    return NextResponse.json({ position: { id: row.id, title: row.title, status: row.status } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
