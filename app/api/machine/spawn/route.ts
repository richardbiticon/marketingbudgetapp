import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rebuildPositions } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent, slugify } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Everything starts from a human. Spawning one on the board creates the real
  role in the hiring room (rebuild section) so the two never drift apart.
  This bridge is deliberately outside the /api/rebuild gate: the board shows
  role titles and counts to the team; the hiring room details stay locked.
*/
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const b = await req.json().catch(() => ({}));
    const title = typeof b.title === "string" && b.title.trim() ? b.title.trim().slice(0, 120) : null;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const tasks: string[] = Array.isArray(b.tasks)
      ? b.tasks.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20)
      : [];

    const [row] = await db.insert(rebuildPositions).values({
      title, slug: slugify(title), status: "active",
      mandate: b.mandate ? String(b.mandate).slice(0, 300) : null,
      tasksNow: tasks, activatedAt: new Date(), updatedBy: actor,
    }).returning();

    await writeRebuildEvent({ positionId: row.id, type: "created", payload: { title, via: "machine" }, actor });
    await writeRebuildEvent({ positionId: row.id, type: "activated", payload: { via: "machine" }, actor });
    return NextResponse.json({ position: { id: row.id, slug: row.slug, title: row.title, status: row.status } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
