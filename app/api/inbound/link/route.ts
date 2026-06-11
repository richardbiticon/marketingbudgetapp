import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { inboundEmails, plannedEmails } from "@/lib/schema";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manually attach a captured inbound email to a planned email.
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const { inboundId, emailId } = await req.json();
    if (!inboundId || !emailId) {
      return NextResponse.json({ error: "inboundId and emailId required" }, { status: 400 });
    }
    const [inb] = await db.select().from(inboundEmails).where(eq(inboundEmails.id, inboundId));
    if (!inb) return NextResponse.json({ error: "Inbound email not found" }, { status: 404 });

    const [em] = await db
      .update(plannedEmails)
      .set({ html: inb.html, updatedAt: new Date() })
      .where(eq(plannedEmails.id, emailId))
      .returning();
    if (!em) return NextResponse.json({ error: "Planned email not found" }, { status: 404 });

    await db.update(inboundEmails).set({ matchedEmailId: emailId }).where(eq(inboundEmails.id, inboundId));
    await logActivity({
      entityType: "campaigns", entityId: em.sendDate.slice(0, 7), actor,
      action: "updated", summary: `linked a test send to "${em.subjectA}"`,
    });
    return NextResponse.json({ email: em });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
