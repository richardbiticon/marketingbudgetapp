import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { machineBoards } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { TEMPLATE_BOARD } from "@/lib/machine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One default board for now. First GET seeds it with the template so the
// map is never empty. The canvas edits locally; Save does the PUT.
async function ensureBoard() {
  const db = getDb();
  const rows = await db.select().from(machineBoards).limit(1);
  if (rows.length) return rows[0];
  const [row] = await db.insert(machineBoards)
    .values({ name: "The Machine", data: TEMPLATE_BOARD, updatedBy: "Template" })
    .returning();
  return row;
}

export async function GET() {
  try {
    const board = await ensureBoard();
    return NextResponse.json({ board });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const { data, expectedUpdatedAt, force } = await req.json().catch(() => ({}));
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return NextResponse.json({ error: "Invalid board data" }, { status: 400 });
    }
    if (data.nodes.length > 600 || data.edges.length > 1200) {
      return NextResponse.json({ error: "Board too large" }, { status: 400 });
    }
    const current = await ensureBoard();
    if (!force && expectedUpdatedAt &&
      new Date(expectedUpdatedAt).getTime() !== current.updatedAt.getTime()) {
      return NextResponse.json(
        { error: "conflict", updatedBy: current.updatedBy, updatedAt: current.updatedAt },
        { status: 409 }
      );
    }
    const [row] = await db.update(machineBoards)
      .set({ data, updatedAt: new Date(), updatedBy: actor })
      .where(eq(machineBoards.id, current.id))
      .returning();
    return NextResponse.json({ board: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
