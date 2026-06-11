import { NextRequest, NextResponse } from "next/server";
import { like, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { plannedEmails } from "@/lib/schema";
import { emailInput } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const month = req.nextUrl.searchParams.get("month"); // "YYYY-MM"
    const rows = await db
      .select()
      .from(plannedEmails)
      .where(month ? like(plannedEmails.sendDate, `${month}-%`) : undefined)
      .orderBy(asc(plannedEmails.sendDate));
    return NextResponse.json({ emails: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const parsed = emailInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const [row] = await db
      .insert(plannedEmails)
      .values({
        sendDate: d.sendDate, track: d.track, platform: d.platform,
        subjectA: d.subjectA, subjectB: d.subjectB ?? null, preheader: d.preheader ?? null,
        body: d.body ?? null, status: d.status, owner: d.owner ?? actor, html: d.html ?? null,
      })
      .returning();
    await logActivity({
      entityType: "campaigns", entityId: row.sendDate.slice(0, 7), actor,
      action: "created", summary: `planned email "${row.subjectA}" for ${row.sendDate}`,
    });
    return NextResponse.json({ email: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
