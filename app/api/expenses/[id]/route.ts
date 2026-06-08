import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { expenses } from "@/lib/schema";
import { expensePatch } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await req.json();
    const parsed = expensePatch.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (d.name !== undefined) patch.name = d.name;
    if (d.channel !== undefined) patch.channel = d.channel;
    if (d.category !== undefined) patch.category = d.category;
    if (d.amount !== undefined) patch.amountCents = Math.round(d.amount * 100);
    if (d.period !== undefined) patch.period = d.period;
    if (d.type !== undefined) patch.type = d.type;
    if (d.status !== undefined) patch.status = d.status;
    if (d.vendor !== undefined) patch.vendor = d.vendor ?? null;
    if (d.notes !== undefined) patch.notes = d.notes ?? null;

    const [row] = await db
      .update(expenses)
      .set(patch)
      .where(eq(expenses.id, params.id))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await logActivity({
      entityType: "budget-month", entityId: row.period, actor: actorFrom(req),
      action: "updated", summary: `edited ${row.name}`,
    });
    return NextResponse.json({ expense: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const [row] = await db
      .delete(expenses)
      .where(eq(expenses.id, params.id))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await logActivity({
      entityType: "budget-month", entityId: row.period, actor: actorFrom(req),
      action: "deleted", summary: `deleted ${row.name}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
