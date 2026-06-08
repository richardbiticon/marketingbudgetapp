import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { targets } from "@/lib/schema";
import { targetInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const period = req.nextUrl.searchParams.get("period");
    const rows = period
      ? await db.select().from(targets).where(eq(targets.period, period))
      : await db.select().from(targets);
    return NextResponse.json({ targets: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Upsert a target for (period, category).
export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const parsed = targetInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const existing = await db
      .select()
      .from(targets)
      .where(and(eq(targets.period, d.period), eq(targets.category, d.category)));

    let row;
    if (existing.length) {
      [row] = await db
        .update(targets)
        .set({ targetPct: String(d.targetPct) })
        .where(eq(targets.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(targets)
        .values({ period: d.period, category: d.category, targetPct: String(d.targetPct) })
        .returning();
    }
    return NextResponse.json({ target: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
