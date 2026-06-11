import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { plannedEmails } from "@/lib/schema";
import { emailPatch } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const parsed = emailPatch.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["sendDate", "track", "platform", "subjectA", "subjectB", "preheader", "body", "status", "owner", "html"] as const) {
      if (d[k] !== undefined) patch[k] = d[k];
    }
    const [row] = await db.update(plannedEmails).set(patch).where(eq(plannedEmails.id, params.id)).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await logActivity({
      entityType: "campaigns", entityId: row.sendDate.slice(0, 7), actor,
      action: "updated", summary: `edited email "${row.subjectA}"`,
    });
    return NextResponse.json({ email: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db.delete(plannedEmails).where(eq(plannedEmails.id, params.id)).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await logActivity({
      entityType: "campaigns", entityId: row.sendDate.slice(0, 7), actor: actorFrom(req),
      action: "deleted", summary: `deleted email "${row.subjectA}"`,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
