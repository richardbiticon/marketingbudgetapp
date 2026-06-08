import { NextRequest, NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { comments } from "@/lib/schema";
import { commentInput } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entityId = sp.get("entityId");
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(comments)
      .where(and(eq(comments.entityType, entityType), eq(comments.entityId, entityId)))
      .orderBy(asc(comments.createdAt));
    return NextResponse.json({ comments: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const parsed = commentInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const [row] = await db
      .insert(comments)
      .values({ entityType: d.entityType, entityId: d.entityId, author: actor, body: d.body })
      .returning();
    await logActivity({
      entityType: d.entityType, entityId: d.entityId, actor,
      action: "commented", summary: `commented: ${d.body.slice(0, 80)}`,
    });
    return NextResponse.json({ comment: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
