import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { expenses } from "@/lib/schema";
import { expenseInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const period = sp.get("period");
    const channel = sp.get("channel");
    const category = sp.get("category");
    const status = sp.get("status");
    const q = sp.get("q");

    const conds = [];
    if (period) conds.push(eq(expenses.period, period));
    if (channel) conds.push(eq(expenses.channel, channel as any));
    if (category) conds.push(eq(expenses.category, category as any));
    if (status) conds.push(eq(expenses.status, status as any));
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(expenses.name, like), ilike(expenses.vendor, like)));
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(expenses.amountCents));

    return NextResponse.json({ expenses: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const parsed = expenseInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const [row] = await db
      .insert(expenses)
      .values({
        name: d.name,
        channel: d.channel,
        category: d.category,
        amountCents: Math.round(d.amount * 100),
        period: d.period,
        type: d.type,
        status: d.status,
        vendor: d.vendor ?? null,
        notes: d.notes ?? null,
      })
      .returning();
    return NextResponse.json({ expense: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
