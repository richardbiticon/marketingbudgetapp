import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/schema";
import { settingsInput } from "@/lib/validation";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureRow() {
  const db = getDb();
  const rows = await db.select().from(settings).limit(1);
  if (rows.length) return rows[0];
  const [row] = await db
    .insert(settings)
    .values({ monthlyBudgetCents: 0, testInnovationPct: "10" })
    .returning();
  return row;
}

export async function GET() {
  try {
    const row = await ensureRow();
    return NextResponse.json({ settings: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const parsed = settingsInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const current = await ensureRow();
    const [row] = await db
      .update(settings)
      .set({
        monthlyBudgetCents: Math.round(parsed.data.monthlyBudget * 100),
        testInnovationPct: String(parsed.data.testInnovationPct),
      })
      .where(eq(settings.id, current.id))
      .returning();
    return NextResponse.json({ settings: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
