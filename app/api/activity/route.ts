import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { activity } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entityId = sp.get("entityId");
    const limit = Math.min(Number(sp.get("limit") ?? 30), 100);

    const conds = [];
    if (entityType) conds.push(eq(activity.entityType, entityType));
    if (entityId) conds.push(eq(activity.entityId, entityId));

    const rows = await db
      .select()
      .from(activity)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(activity.createdAt))
      .limit(limit);

    return NextResponse.json({ activity: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
