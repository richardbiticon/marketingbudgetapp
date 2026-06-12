import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { machineBoards, rebuildPositions } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { TEMPLATE_BOARD, type BoardData } from "@/lib/machine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function positionIdsBySlug() {
  const db = getDb();
  const positions = await db.select().from(rebuildPositions);
  return new Map(positions.map((p) => [p.slug, p.id]));
}

function linkTemplateNodes(nodes: BoardData["nodes"], bySlug: Map<string, string>) {
  // Template node id -> hiring-room slug, so boards saved before linking
  // existed can be healed in place without touching layout.
  const refByTemplateId = new Map(
    TEMPLATE_BOARD.nodes.filter((n) => n.positionRef).map((n) => [n.id, n.positionRef!])
  );
  let changed = false;
  const out = nodes.map((n) => {
    const ref = n.positionRef ?? refByTemplateId.get(n.id);
    if (n.type === "person" && !n.positionId && ref && bySlug.has(ref)) {
      changed = true;
      const { positionRef, ...rest } = n;
      return { ...rest, positionId: bySlug.get(ref)! };
    }
    return n;
  });
  return { out, changed };
}

// One default board for now. First GET seeds it with the template (person
// nodes linked to hiring-room positions by slug). Existing boards self-heal:
// unlinked template people get their positionId added in place. The canvas
// edits locally; Save does the PUT.
async function ensureBoard() {
  const db = getDb();
  const rows = await db.select().from(machineBoards).limit(1);
  if (rows.length) {
    const row = rows[0];
    const data = row.data as BoardData;
    if (Array.isArray(data?.nodes)) {
      const { out, changed } = linkTemplateNodes(data.nodes, await positionIdsBySlug());
      if (changed) {
        const [updated] = await db.update(machineBoards)
          .set({ data: { ...data, nodes: out }, updatedAt: new Date() })
          .where(eq(machineBoards.id, row.id))
          .returning();
        return updated;
      }
    }
    return row;
  }

  const bySlug = await positionIdsBySlug();
  const { out } = linkTemplateNodes(TEMPLATE_BOARD.nodes, bySlug);
  const data: BoardData = { ...TEMPLATE_BOARD, nodes: out };
  const [row] = await db.insert(machineBoards)
    .values({ name: "The Machine", data, updatedBy: "Template" })
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
