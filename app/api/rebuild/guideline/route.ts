import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rebuildGuideline } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureRow() {
  const db = getDb();
  const rows = await db.select().from(rebuildGuideline).limit(1);
  if (rows.length) return rows[0];
  const [row] = await db.insert(rebuildGuideline).values({ content: "# The MMC Rebuild\n\nEdit this page.", updatedBy: "System" }).returning();
  return row;
}

export async function GET() {
  try {
    const row = await ensureRow();
    return NextResponse.json({ guideline: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const { content } = await req.json();
    if (typeof content !== "string" || content.length > 200000) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    const current = await ensureRow();
    const [row] = await db.update(rebuildGuideline)
      .set({ content, updatedAt: new Date(), updatedBy: actorFrom(req) })
      .where(eq(rebuildGuideline.id, current.id))
      .returning();
    return NextResponse.json({ guideline: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
